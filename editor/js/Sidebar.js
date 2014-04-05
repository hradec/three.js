var Sidebar = function ( editor ) {

	var container = new UI.Panel();

    var tabs = new UI.Tab();

    var container1 = new UI.Panel();

    container1.add( new Sidebar.Scene( editor ) );
	container1.add( new Sidebar.Object3D( editor ) );
    //container.add( new Sidebar.Material( editor ) );
	//container.add( new Sidebar.Geometry( editor ) );
	//container.add( new Sidebar.Animation( editor ) );
    
    var container2 = new UI.Panel();
    container2.add( new Sidebar.Renderer( editor ) );

    var containerPrint = new UI.Panel();
    containerPrint.add( new Sidebar.Print( editor ));

    //container.add( container2 );
    
    tabs.add( "MODEL", container1, 1 );
    tabs.add( "PRINT", containerPrint );
    tabs.add( "SETUP", container2 );

    container.add( tabs );

	return container;

}
