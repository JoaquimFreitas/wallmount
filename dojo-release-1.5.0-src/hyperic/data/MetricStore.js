/**
 * NOTE: This copyright does *not* cover user programs that use HQ
 * program services by normal system calls through the application
 * program interfaces provided as part of the Hyperic Plug-in Development
 * Kit or the Hyperic Client Development Kit - this is merely considered
 * normal use of the program, and does *not* fall under the heading of
 *  "derived work".
 *
 *  Copyright (C) [2011], VMware, Inc.
 *  This file is part of HQ.
 *
 *  HQ is free software; you can redistribute it and/or modify
 *  it under the terms version 2 of the GNU General Public License as
 *  published by the Free Software Foundation. This program is distributed
 *  in the hope that it will be useful, but WITHOUT ANY WARRANTY; without
 *  even the implied warranty of MERCHANTABILITY or FITNESS FOR A
 *  PARTICULAR PURPOSE. See the GNU General Public License for more
 *  details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program; if not, write to the Free Software
 *  Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA 02111-1307
 *  USA.
 *
 */

dojo.provide("hyperic.data.MetricStore");

dojo.require("dojox.timing._base");

dojo.declare("hyperic.data.MetricStore", null, {
	// summary:
	//     Allow clients to subscribe to metric information and
	//     receive updates from store once new information is
	//     retreived from the server.
	//
	// description:
	//     Clients for this store are able to subscribe itself to
	//     various topics to receive automatic or on-demand
	//     updates from the backend.
	//
	// update logic:
	//     1. Client subscribes to topic - either metric or
	//        resource availability
	//     2. If topic known and under sync, do callback to notify
	//        client for new value. This is a value/status already
	//        known by store.
	//     3. If topic not known, initiate sync immediately.
	//     4. Later when value is retrieved from the backend, client gets it
	//        through registered callback.
	//     5. Do periodic syncs on background, check if there are
	//        clients interested to receive events for specific metric.
	//        If not, there's no need to sync
	//
	// topic definitions:
	//     last metric value:
    //     /hyperic/metric/0/12345
	//     {
	//       status: integer (0=requestok, 1=requesterror)
	//       id: integer (metric id)
	//       last: number (raw metric value)
	//     }
	//
    //     /hyperic/metric/60/12345
    //     /hyperic/metric/480/12345
    //
	//     resource:  availability
    //     /hyperic/ravail/1:12345 (platform)
    //     /hyperic/ravail/2:12345 (server)
    //     /hyperic/ravail/3:12345 (service)
    //     /hyperic/ravail/4:12345 (application)
    //     /hyperic/ravail/5:12345 (group)
    //
    //     resource type: availability
    //     /hyperic/tavail/1:12345 (all platforms)
    //     /hyperic/tavail/2:12345 (all servers)
    //     /hyperic/tavail/3:12345 (all services)
	//
    //     /hyperic/tavail/1:12345/2:23456 (for platform 12345, for server type 23456)
    //     /hyperic/tavail/1:12345/3:23456 (for platform 12345, for service type 23456)
	//

    // url: String
    //      The URL to the metric data service
    url: "",
    
    // urlPreventCache: String
    //      Flag to dennote if preventCache should be passed to xhrGet.
    urlPreventCache: true,
    
    // idToBaseUrl: Boolean
    //      Indicates whether metric id should be postfixed to base url
    idToBaseUrl: false,
    
    // internal data
    
    // _baseTopic: String
    //      Prefix to topic to be used
    _baseTopic: "/hyperic/",
    _timer: null,
    _interval: 60000,
    
    // flag telling there's new subscribe which
    // request hasn't been processed. Update loop
    // can do immediate request if this is true.
    _subscribeRequestPending: false,
    
    // flag telling if normal interval is in use
    _normalInterval: true,

    constructor: function(/*Object*/args){
        // summary:
        //      Initialize this store with possibility to change some
        //      core functional values.
        //
        // arguments:
        //      args: Object
        //          url: String
        //          idToBaseUrl: String
        //          urlPreventCache: Boolean
        //          syncTime: Number
        
    	this._current = {};
    	this._clients = {};
    	
        if(args && args.url){
            this.url = args.url;
        }

        if(args && args.idToBaseUrl){
            this.idToBaseUrl = args.idToBaseUrl;
        }
        
        if(args && "urlPreventCache" in args){
            this.urlPreventCache = args.urlPreventCache?true:false;
        }
        this._interval = args.syncTime || 60000;
        this._timer = timer = new dojox.timing.Timer(this._interval);
        dojo.connect(timer, "onTick", dojo.hitch(this, "updateStore"));
        
    },

    sync: function(/*Boolean*/status){
        // summary:
        //      Start or stop background sync timer
        // arguments:
        //      status: Boolean
        //          If true start time, if false stop timer.
        
        if(status) {
            this._timer.start();    
        } else {
            this._timer.stop();             
        }
    },
    
    loadItem: function(request){
        // summary:
        //      Loads Item from backend store.
        // arguments:
        //      request: Object
        //          id: String
        //              
        request = request || {};
    	var self = this;
    	var reqParams = {};
    	
    	if(request.resId){    
            reqParams.scope = request.scope + request.resId;
            reqParams.id = request.resId;
    	}
    	
        var getArgs = {
            url: this._getUrl(reqParams.scope),
            preventCache: this.urlPreventCache,
            failOk: true,
            handleAs: "json-comment-optional",
            content: reqParams
        };

        var deferred = dojo.xhrGet(getArgs);

        deferred.addCallback(function(data){self._processResult(data, request);});
        deferred.addErrback(function(error){self._processError(error, request);});
    },
    
    updateStore: function(){
    	// summary:
    	//     Updates status of all items currently
    	//     handled by this store.

    	for(var i in this._clients){
            var val = this._clients[i];
            
            // /hyperic/metric/0/12345 to metric/0/12345
            var id = i.substring(this._baseTopic.length, i.length);
            var d = id.lastIndexOf('/');
            var scope = id.substring(0, d+1);
            
            // TODO: combine to single request.
            // id: "ravail/1:10303" "metric/0/10522"
            // scope: "ravail/" "metric/0/"
            
            // resId: either metric id or eid
            var resId = id.substring(scope.length);
            if(val > 0)
                this.loadItem({resId: resId, scope: scope});
            
            // marking that there's not requests pending.
            // subscriber may set it true during this for loop
        	this._subscribeRequestPending = false;
        }
    	
    	// handle timer kicking and restoring to normal interval
    	if(this._subscribeRequestPending) {
    		this._kickTimer();
    	} else if(!this._normalInterval) {
    		this._restoreTimer();
    	}
    },

    fetch: function(/* Object */ keywordArgs){
        // summary:
        //     xxx
        
        var request = null; 
        throw new Error('Unimplemented API: dojo.data.api.Read.fetch');
        return request; // an object conforming to the dojo.data.api.Request API
    },
    
    subscribe: function(topic, scope, method, acceptNull){
        // summary:
        //     Subscribes client to a specific topic
        
    	var _topic = this._baseTopic + topic;
    	var hdl = dojo.subscribe(_topic, scope, method);
    	if(acceptNull || this._current[_topic]){
    		var a = this._current[_topic];
    		var arg = (a == null) ?  null : (a.length == 1) ? a[0] : a;
    		scope[method].call(scope, arg);
    	}
    	this._updateInterests(hdl, true);
    	
    	// try to kick timer if it's needed
    	this._subscribeRequestPending = true;
		this._kickTimer();
		
    	return hdl;
    },

    unsubscribe: function(handle){
        // summary:
        //     Unsubscribes client from a specific metric
        
        this._updateInterests(handle, false);
        dojo.unsubscribe(handle);
    },
    
    publish: function(topic, args){
        // summary:
        //     Publish event to a specific topic notifying
        //     updates for metric.
        
        var _topic = this._baseTopic + topic;
    	dojo.publish(_topic, args);
    	this._current[_topic] = args;
    },
    
    _getUrl: function(id){
        // summary:
    	//     Handles spesial url handling. This method is here
    	//     mostly to make it easier to do tests offline.
        
    	if(!id)
           return this.url;
    	if(this.idToBaseUrl)
    	   return this.url + id;
    	else
    	   return this.url;
    },
    
    _updateInterests: function(handle, /*Boolean*/subscribe){
        // summary:
        //     Updates interest table to contain correct number
        //     of clients currently listening events for a
        //     specific metrics.
        
    	if(!this._clients[handle[0]]) {
    		this._clients[handle[0]] = 0;
    	}
    	var x = this._clients[handle[0]];
    	if(subscribe) {
    	   this._clients[handle[0]] = x+1;	
    	} else {
    		this._clients[handle[0]] = (x < 1 ? 0 : x-1);
    	}
    },
    
    _processResult: function(data, request){
        // summary:
    	//     Callback from xhr request. Does a simple publish
    	//     to subscribers.
        
        for(var i = 0; i<data.length; i++) {
            this.publish(request.scope + data[i].id, [dojo.mixin({status:0},data[i])]);        	
        }
    	  	
    },
    
    _processError: function(error, request){
        // summary:
    	//     Processing request error and notifying 
    	//     topic of it. Listener can then show that
    	//     data has become stale e.g.
    	
    	// post error status to topic
    	this.publish(request.scope + request.resId, [{status:1,id:request.resId}]);
    },
    
    _kickTimer: function() {
    	// summary:
    	//     Kicks timer to execute after 3 secs if
    	//     there are pending requests and if timer is 
    	//     not under normal interval.
    	
    	if(this._subscribeRequestPending && this._normalInterval) {
        	this._timer.stop();
        	this._timer.setInterval(3000);
        	this._timer.start();
        	this._normalInterval = false;
    	}
    },

    _restoreTimer: function() {
    	// summary:
    	//     Restoring timer to its original interval
    	
    	this._timer.stop();
    	this._timer.setInterval(this._interval);
    	this._timer.start();    	
    	this._normalInterval = true;
    }

});