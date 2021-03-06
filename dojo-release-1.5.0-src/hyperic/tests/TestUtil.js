dojo.provide("hyperic.tests.TestUtil");
dojo.require("hyperic.util.LayoutTestWindow");
dojo.require("hyperic.wallmount.LayoutUtil");

hyperic.tests.TestUtil.newLayoutTestWindow = function() {
	
	var templateString = dojo.cache("hyperic.tests","TestLayoutContent.html");

    var layoutObj = hyperic.wallmount.LayoutUtil.getLayoutAsJSONObj();	
	var layout = dojo.toJson(layoutObj);
	
    var testWin = new hyperic.util.LayoutTestWindow({content:templateString, layoutJson:layout, w:layoutObj.w, h:layoutObj.h});
    testWin.open();
};


hyperic.tests.TestUtil.selectLayoutDialog = function() {
    console.log("selectLayoutDialog");
    if(!hyperic.tests.TestUtil.layoutDlg) {
        hyperic.tests.TestUtil.layoutDlg = new hyperic.dialog.LoadLayoutDialog({
            title: "Select Layout",
            layoutsUrl: "/dojo-release-1.5.0-src/hyperic/tests/layouts/layouts",
            widgetsInTemplate: true,
            style: "width: 300px"
        });     
    }
    hyperic.tests.TestUtil.layoutDlg.show();  
};

hyperic.tests.TestUtil.selectMultiLayoutDialog = function() {
    console.log("selectMultiLayoutDialog");
    if(!hyperic.tests.TestUtil.multiLayoutDlg) {
        hyperic.tests.TestUtil.multiLayoutDlg = new hyperic.dialog.LoadLayoutDialog({
            title: "Select Multi-layout",
            layoutsUrl: "/dojo-release-1.5.0-src/hyperic/tests/layouts/multi/multilayouts",
            widgetsInTemplate: true,
            style: "width: 300px"
        });     
    }
    hyperic.tests.TestUtil.multiLayoutDlg.show();  
};

hyperic.tests.TestUtil.logLayoutJSON = function() {
	var json = hyperic.wallmount.LayoutUtil.getLayoutAsJSON();
	console.log(json);
};

hyperic.tests.TestUtil.logMultiLayoutJSON = function() {
	var json = hyperic.wallmount.LayoutUtil.getMultiLayoutAsJSON();
	console.log(json);
};