

Sidebar.Print = function ( editor ) {
    
    var backupCSS = new UI.Button().dom.style.backgroundImage;


    var signals = editor.signals;
    
    var container = new UI.Panel();

	//container.add( new UI.Text( 'PRINT' ) );
	//container.add( new UI.Break(), new UI.Break() );

	// class

    var slices = new UI.CollapsiblePanel();
    slices.addStatic( new UI.Text( 'SLICES' ) );
    var sliceThick      = new UI.Number().setWidth( '50px' ).onChange( updatePrint );
	var sliceTime       = new UI.Number().setWidth( '50px' ).onChange( updatePrint );
    var sliceInitThick  = new UI.Number().setWidth( '50px' ).onChange( updatePrint );
    var sliceInitTime   = new UI.Number().setWidth( '50px' ).onChange( updatePrint );
    var sliceTransition = new UI.Number().setWidth( '50px' ).onChange( updatePrint );
    
    sliceThick.setValue(100);
    sliceTime.setValue(5);
    sliceInitThick.setValue(100);
    sliceInitTime.setValue(25);
    sliceTransition.setValue(5);
    
    retrievePrintData();
    

    //slices.add( new UI.Text( 'SLICER' ) );
    slices.add( new UI.Break() )
    slices.add( new UI.Text( 'Initial layer thickness' ).setWidth( '90px' ) , sliceInitThick);
    slices.add( new UI.Text( 'Initial layer time' ).setWidth( '90px' ) , sliceInitTime);
    slices.add( new UI.Break(), new UI.Break()  )
    slices.add( new UI.Text( 'Number of Layers to Transition    from Initial to Normal layer setup' ).setWidth( '240px' ) , sliceTransition);
    slices.add( new UI.Break(), new UI.Break()  )
    slices.add( new UI.Text( 'Normal layer thickness' ).setWidth( '90px' ) , sliceThick);
    slices.add( new UI.Text( 'Normal layer time' ).setWidth( '90px' ) , sliceTime);

    slices.add( new UI.Break(), new UI.Break() )
    
    function startPrinting()
    {
        aClient = new HttpClient();
        aClient.get('http://pi3dprint.local/control?rt=1;startPrint="1"', function(answer) {console.log(answer);});
    }
    function cancelPrinting()
    {
        aClient = new HttpClient();
        aClient.get('http://pi3dprint.local/control?rt=1;cancelPrint="1"', function(answer) {console.log(answer);});
    }
    function pausePrinting()
    {
        aClient = new HttpClient();
        aClient.get('http://pi3dprint.local/control?rt=1;pausePrint="1"', function(answer) {console.log(answer);});
    }

    var startPrint  = new UI.Button( 'Start Printing'  ).setWidth( '100%' ).setHeight( '25px' ).onClick( startPrinting  );
    var pausePrint  = new UI.Button( 'Pause Printing'  ).setWidth( '100%' ).setHeight( '25px' ).onClick( pausePrinting  );
    var cancelPrint = new UI.Button( 'Cancel Printing' ).setWidth( '100%' ).setHeight( '25px' ).onClick( cancelPrinting );
    
    startPrint.setDisabled(true);
    pausePrint.setDisabled(true);
    cancelPrint.setDisabled(false);


    var printButton = new UI.Button( 'Submit Print' ).setWidth( '100%' ).setHeight( '25px' ).onClick( function () {
//        printButton.dom.style.backgroundColor = '#faa';
        printButton.setDisabled(true);

        var output = ''
        editor.scene.traverse( function ( obj ) {
            if ( obj instanceof THREE.Mesh ){
                var exporter = new THREE.OBJExporter();
                output += exporter.parse( obj.geometry );
            }
        });
        
        printButton.innerHTML = printButton.dom.innerHTML;
        printButton.backgroundImage = backupCSS;
        
        cancelPrinting();

        var xhr = new XMLHttpRequest();
        xhr.open("POST", "http://pi3dprint.local/static/put.php", true);
        //xhr.open("POST", "http://pi3dprint.local/upload", true);
        xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        xhr.onreadystatechange = function ()
        {
            console.log(xhr.readyState);
            console.log(xhr.status);
            if (xhr.readyState == 4 && xhr.status == 200){
                console.log(xhr.response);
                //alert("File uploaded!");
                startPrinting();
                printButton.setDisabled(false);
                startPrint.setDisabled(false);
                pausePrint.setDisabled(false);
                cancelPrint.setDisabled(false);
                printButton.dom.style.backgroundImage = backupCSS;
                printButton.dom.innerHTML = printButton.innerHTML;
            }
            
        }
        if ( xhr.upload ) {
            xhr.upload.onprogress = function(e) {
                var done = e.position || e.loaded, total = e.totalSize || e.total;
                var perc = (Math.floor(done/total*1000)/10);
                console.log('xhr.upload progress: ' + done + ' / ' + total + ' = ' + perc + '%');
                printButton.dom.innerHTML = "Uploading data to printer..."
                printButton.dom.style.backgroundImage = "-webkit-linear-gradient(left, rgba(100,244,131,1) "+perc+"%,rgba(255,255,255,0) "+perc+"%)";
            };
        }
        //xhr.send("filedata="+encodeURIComponent(output));
        xhr.send(output);
        
    } );




    slices.add( printButton );
    slices.add( startPrint );
    slices.add( pausePrint );
    slices.add( cancelPrint );
    
    
    var control = new UI.CollapsiblePanel();
    control.addStatic( new UI.Text( 'PRINTER CONTROL' ) );

    //var control = new UI.CPanel( 'PRINTER_CONTROL' );
    //control.add( new UI.Text( 'PRINTER CONTROL' ) );
    
    function moveAxis(self,z){
        self.setDisabled(true);
        self.backgroundColor = backupCSS;//'#eee'; //self.dom.style.backgroundColor;
        self.dom.style.backgroundColor = '#faa';
        
        var xhr = new XMLHttpRequest();
        xhr.open("GET", 'http://pi3dprint.local/control?rt=1;z='+z, true);
        //xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        xhr.timeout = 3000;
        xhr.ontimeout = function () { 
            //alert("Timed out!!!"); 
            self.dom.style.backgroundColor = '#ffe';
            self.setDisabled(false);
        }
        xhr.onreadystatechange = function ()
        {
            if (xhr.readyState == 4){
                console.log(xhr.response);
                if(xhr.status == 200)
                    self.dom.style.backgroundColor = self.backgroundColor;
                else
                    self.dom.style.backgroundColor = '#ffe';
                self.setDisabled(false);
            }            
        }
        if ( xhr.upload ) {
            xhr.upload.onprogress = function(e) {
            };
        }
        xhr.send();
    }

    control.add( 
        new UI.Break(),

        new UI.Button( '-100' ).setWidth( '12.5%' ).setHeight( '30px' ).onClick( function () {
            moveAxis(this,-100);
        } ), 
        new UI.Button( '-10' ).setWidth( '12.5%' ).setHeight( '30px' ).onClick( function () {
            moveAxis(this,-10);
        } ), 
        new UI.Button( '-1' ).setWidth( '12.5%' ).setHeight( '30px' ).onClick( function () {
            moveAxis(this,-1);
        } ), 
        new UI.Button( '-0.1' ).setWidth( '12.5%' ).setHeight( '30px' ).onClick( function () {
            moveAxis(this,-0.1);
        } ), 
        
        new UI.Button( '+0.1' ).setWidth( '12.5%' ).setHeight( '30px' ).onClick( function () {
            moveAxis(this,0.1);
        } ), 
        new UI.Button( '+1' ).setWidth( '12.5%' ).setHeight( '30px' ).onClick( function () {
            moveAxis(this,1);
        } ), 
        new UI.Button( '+10' ).setWidth( '12.5%' ).setHeight( '30px' ).onClick( function () {
            moveAxis(this,10);
        } ), 
        new UI.Button( '+100' ).setWidth( '12.5%' ).setHeight( '30px' ).onClick( function () {
            moveAxis(this,100);
        } ),
        
        //new UI.Break(),new UI.Break(),
        
        new UI.Button( 'home axis' ).setWidth( '100%' ).setHeight( '20px' ).onClick( function () {
            moveAxis(this,'home');
        } )
    );



    function updatePrint() {
        // store variables for print in our host via ajax!
        aClient = new HttpClient();
            
        vars  = 'sliceThick='+sliceThick.getValue()
        vars += ';sliceTime='+sliceTime.getValue()
        vars += ';sliceInitThick='+sliceInitThick.getValue()
        vars += ';sliceInitTime='+sliceInitTime.getValue()
        vars += ';sliceTransition='+sliceTransition.getValue()
            
        aClient.get('http://pi3dprint.local/control?'+vars, function(answer) {});
    }
    function retrievePrintData() {
        // we let python return the proper js syntax for the variables stored in its DB
        // this way we allways retrieve all vars, even if we add new ones!
        aClient = new HttpClient();
        aClient.get('http://pi3dprint.local/control?js', function(answer) {
            console.log(answer);
            eval(answer);
        });
            
            
    }
    
    
    function getStyleSheetPropertyValue(selectorText, propertyName) {
        // search backwards because the last match is more likely the right one
        for (var s= document.styleSheets.length - 1; s >= 0; s--) {
            var cssRules = document.styleSheets[s].cssRules ||
                    document.styleSheets[s].rules || []; // IE support
            for (var c=0; c < cssRules.length; c++) {
                if (cssRules[c].selectorText === selectorText) 
                    return cssRules[c].style[propertyName];
            }
        }
        return null;
    }


    
    
    document.addEventListener('printerOnline', function (e) {
        var all = container.dom.querySelectorAll('*')
        for(var i = 0; i < all.length; i++){
            all[i].disabled = all[i].disabled_bkp;
            //console.log( getStyleSheetPropertyValue('button','background-color') );
            //all[i].backgroundColor = getStyleSheetPropertyValue('button','background-color');
        }
        container.dom.style.webkitFilter  = 'blur(0px)  brightness(100%)';
        //container.dom.style.webkitFilter  = ' ';
        //console.log(container.dom.style.webkitFilter)
        //piScreen.dom.src='http://pi3dprint.local';
        //piScreen.dom.contentWindow.location.reload(true);
        //_reloadPrintScreen();
    }, false);

    document.addEventListener('printerOffline', function (e) {
        var all = container.dom.querySelectorAll('*')
        for(var i = 0; i < all.length; i++){
            all[i].disabled = true;
        }
        container.dom.style.webkitFilter  = 'blur(2px) brightness(120%)';
    }, false);
    
    
    var piScreenPanel = new UI.CollapsiblePanel();
    piScreenPanel.addStatic( new UI.Text( 'PRINTER_SCREEN_CAPTURE' ) );    
    //var piScreenPanel = new UI.CPanel("PRINTER_SCREEN_CAPTURE");
    
    var piScreen = new UI.IFrame('http://pi3dprint.local');
    piScreen.dom.height = "200px";
    piScreen.dom.width = "100%";
    piScreen.dom.frameborder = 0;

    function _reloadPrintScreen(){
        piScreen.dom.src='http://pi3dprint.local';
        piScreen.dom.contentWindow.location.reload(true);
    }

    var reloadPiScreen = new UI.Button( 'Refresh' ).setWidth( '100%' ).setHeight( '20px' ).onClick( function () {
        _reloadPrintScreen();
    } );
    
    
    function bash(cmd){
        aClient = new HttpClient();
        aClient.get('http://pi3dprint.local/control?rt=1;bash='+cmd, function(answer) {
            console.log(answer);
        });
    }
    
    var reboot = new UI.Button( 'Reboot Printer' ).setWidth( '100%' ).setHeight( '20px' ).onClick( function () {
        bash("sudo reboot");
    } );
    var halt = new UI.Button( 'Power Off Printer' ).setWidth( '100%' ).setHeight( '20px' ).onClick( function () {
        bash("sudo halt");
    } );

    piScreenPanel.add( piScreen );
    piScreenPanel.add( reloadPiScreen );
    piScreenPanel.add( reboot );
    piScreenPanel.add( halt );
    

    container.add( control );
    container.add( slices );
    container.add( piScreenPanel );
    container.dom.style.webkitFilter  = 'blur(2px) brightness(120%)';


	return container;
    

}


