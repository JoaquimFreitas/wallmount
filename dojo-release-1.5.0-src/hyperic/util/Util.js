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

dojo.provide("hyperic.util.Util");

hyperic.util.Util.zeroMinInsets = function(/*Object*/obj){
    // summary:
    //     Returns insets with min of zero values
    return {
    	top: Math.max(obj.top,0),
        left: Math.max(obj.left,0),
        bottom: Math.max(obj.bottom,0),
        right: Math.max(obj.right,0)
    };
};

hyperic.util.Util.toArray = function(t){
    // summary:
    //     Converts object to array of size 1. If it's
	//     already an array, return it unmodified.
	return dojo.isArray(t) ? t : [t];
};
