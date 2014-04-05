var Toolbar = function ( editor ) {

	var signals = editor.signals;

	var container = new UI.Panel();

	var buttons = new UI.Panel();
	container.add( buttons );

	// translate / rotate / scale

	var translate = new UI.Button( 'translate' ).onClick( function () {

		signals.transformModeChanged.dispatch( 'translate' );

	} );
	buttons.add( translate );

	var rotate = new UI.Button( 'rotate' ).onClick( function () {

		signals.transformModeChanged.dispatch( 'rotate' );

	} );
	buttons.add( rotate );

    var scale = new UI.Button( 'scale' ).onClick( function () {

		signals.transformModeChanged.dispatch( 'scale' );

	} );
	buttons.add( scale );

    var clone = new UI.Button( 'clone X' ).onClick( function () {

//        signals.transformModeChanged.dispatch( 'clone' );

		var object = editor.selected;

		if ( object.parent === undefined ) return; // avoid cloning the camera or scene

		nobject = object.clone();
        nobject.yup = object.yup;
    	editor.parent( nobject, editor.scene.getObjectById( object.parent.id, true ) );

		editor.addObject( nobject );
        nobject.position.x = nobject.position.x + (object.geometry.boundingBox.max.x-object.geometry.boundingBox.min.x)*nobject.scale.x+5;
        console.log(object);

        editor.select( nobject );


	} );
	buttons.add( clone );

    var cloneZ = new UI.Button( 'clone Z' ).onClick( function () {

//        signals.transformModeChanged.dispatch( 'clone' );

		var object = editor.selected;

		if ( object.parent === undefined ) return; // avoid cloning the camera or scene

		nobject = object.clone();
        nobject.yup = object.yup;
        editor.parent( nobject, editor.scene.getObjectById( object.parent.id, true ) );

		editor.addObject( nobject );
        if( object.yup ){
            nobject.position.z = nobject.position.z + (object.geometry.boundingBox.max.y-object.geometry.boundingBox.min.y)*nobject.scale.y+5;
        }else{
            nobject.position.z = nobject.position.z + (object.geometry.boundingBox.max.z-object.geometry.boundingBox.min.z)*nobject.scale.z+5;
        }
        console.log(object);

        editor.select( nobject );

	} );
	buttons.add( cloneZ );


	// grid

	var grid = new UI.Number( 25 ).onChange( update );
	grid.dom.style.width = '42px';
	buttons.add( new UI.Text( 'Grid: ' ) );
	buttons.add( grid );

	var snap = new UI.Checkbox( false ).onChange( update ).setValue(true);
	buttons.add( snap );
	buttons.add( new UI.Text( 'snap' ) );

	var local = new UI.Checkbox( false ).onChange( update );
	buttons.add( local );
	buttons.add( new UI.Text( 'local' ) );

	function update() {

		signals.snapChanged.dispatch( snap.getValue() === true ? grid.getValue() : null );
		signals.spaceChanged.dispatch( local.getValue() === true ? "local" : "world" );

	}

	update();

	return container;

}
