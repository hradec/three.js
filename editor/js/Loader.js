function submit(output) {
        var xhr = new XMLHttpRequest();
        xhr.open("POST", "http://pi3dprint.local/static/upload.php", true);
        //xhr.open("POST", "http://pi3dprint.local/upload", true);
        xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        xhr.onreadystatechange = function ()
        {
            console.log(xhr.readyState);
            console.log(xhr.status);
            if (xhr.readyState == 4 && xhr.status == 200){
                console.log(xhr.response);
                //alert("File uploaded!");
                //aClient = new HttpClient();
                //aClient.get('http://pi3dprint.local/control?rt=1;startPrint="1"', function(answer) {console.log(answer);});
            }
            
        }
        if ( xhr.upload ) {
            xhr.upload.onprogress = function(e) {
                var done = e.position || e.loaded, total = e.totalSize || e.total;
                var perc = (Math.floor(done/total*1000)/10);
                console.log('xhr.upload progress: ' + done + ' / ' + total + ' = ' + perc + '%');
            };
        }
        xhr.send("filedata="+encodeURIComponent(output));
        
};



var Loader = function ( editor ) {

	var scope = this;
	var signals = editor.signals;
    
    
    

	this.loadFile = function ( file ) {

		var filename = file.name;
		var extension = filename.split( '.' ).pop().toLowerCase();

        NProgress.start();

		switch ( extension ) {

			case 'babylon':

				var reader = new FileReader();
				reader.addEventListener( 'load', function ( event ) {

					var contents = event.target.result;
					var json = JSON.parse( contents );

					var loader = new THREE.BabylonLoader();
					var scene = loader.parse( json );

					editor.setScene( scene );

				}, false );
				reader.readAsText( file );

				break;

			case 'ctm':

				var reader = new FileReader();
				reader.addEventListener( 'load', function ( event ) {

					var data = new Uint8Array( event.target.result );

					var stream = new CTM.Stream( data );
					stream.offset = 0;

					var loader = new THREE.CTMLoader();
					loader.createModel( new CTM.File( stream ), function( geometry ) {

						geometry.sourceType = "ctm";
						geometry.sourceFile = file.name;

						var material = new THREE.MeshPhongMaterial();

						var mesh = new THREE.Mesh( geometry, material );
						mesh.name = filename;

						editor.addObject( mesh );
						editor.select( mesh );

					} );

				}, false );
				reader.readAsArrayBuffer( file );

				break;

			case 'dae':

				var reader = new FileReader();
				reader.addEventListener( 'load', function ( event ) {

					var contents = event.target.result;

					var parser = new DOMParser();
					var xml = parser.parseFromString( contents, 'text/xml' );

					var loader = new THREE.ColladaLoader();
					loader.parse( xml, function ( collada ) {

						collada.scene.name = filename;

						editor.addObject( collada.scene );
						editor.select( collada.scene );

					} );

				}, false );
				reader.readAsText( file );

				break;

			case 'js':
			case 'json':

			case '3geo':
			case '3mat':
			case '3obj':
			case '3scn':

				var reader = new FileReader();
				reader.addEventListener( 'load', function ( event ) {

					var contents = event.target.result;

					// 2.0

					if ( contents.indexOf( 'postMessage' ) !== -1 ) {

						var blob = new Blob( [ contents ], { type: 'text/javascript' } );
						var url = URL.createObjectURL( blob );

						var worker = new Worker( url );

						worker.onmessage = function ( event ) {

							event.data.metadata = { version: 2 };
							handleJSON( event.data, file, filename );

						};

						worker.postMessage( Date.now() );

						return;

					}

					// >= 3.0

					var data;

					try {

						data = JSON.parse( contents );

					} catch ( error ) {

						alert( error );
						return;

					}

					handleJSON( data, file, filename );

				}, false );
				reader.readAsText( file );

				break;

			case 'obj':

				var reader = new FileReader();
				reader.addEventListener( 'load', function ( event ) {

					var contents = event.target.result;

                        
                    submit(contents);
                    
    				var object = new THREE.OBJLoader().parse( contents );
    				//var object = new THREE.AssimpJSONLoader().parse(  contents  );
					
                    object.traverse( function ( obj ) {
                        if ( obj instanceof THREE.Mesh ){
                            obj.name = filename;
            			    editor.addObject( obj );
        				    editor.select( obj );
                        }
                    });
                        

				}, false );
				//timeout = setTimeout( function (){
                    reader.readAsText( file );
				//},10000);

				break;

			case 'ply':

				var reader = new FileReader();
				reader.addEventListener( 'load', function ( event ) {

					var contents = event.target.result;

					var geometry = new THREE.PLYLoader().parse( contents );
					geometry.sourceType = "ply";
					geometry.sourceFile = file.name;
                    geometry.computeFaceNormals();

					var material = new THREE.MeshPhongMaterial();

					var mesh = new THREE.Mesh( geometry, material );
					mesh.name = filename;

					editor.addObject( mesh );
					editor.select( mesh );

				}, false );
				reader.readAsText( file );

				break;

			case 'stl':

				var reader = new FileReader();
				reader.addEventListener( 'load', function ( event ) {

					var contents = event.target.result;

                        
                    submit(contents);
                    

					var geometry = new THREE.STLLoader().parse( contents );
					geometry.sourceType = "stl";
					geometry.sourceFile = file.name;
                    //geometry.mergeVertices();

					var material = new THREE.MeshNormalMaterial();

					var mesh = new THREE.Mesh( geometry, material );
					mesh.name = filename;
                    /*
                    for ( v = 0; v < obj.geometry.vertices.length; v ++ ) {
                           obj.geometry.vertices[ v ].z = obj.geometry.vertices[ v ].z-obj.boundingBox.min.z;
                    }
                    obj.geometry.verticesNeedUpdate = true;
                    obj.geometry.computeBoundingBox();
                    */
                    
					editor.addObject( mesh );
					editor.select( mesh );
                    mesh.yup = true;
                    mesh.rotation.x=deg2rad(-90);


				}, false );

                timeout = setTimeout( function (){
                    if ( reader.readAsBinaryString !== undefined ) {
    
        				reader.readAsBinaryString( file );
    
    				} else {
    
    					reader.readAsArrayBuffer( file );
    
    				}
                },10000);

				
				break;

			/*
			case 'utf8':

				var reader = new FileReader();
				reader.addEventListener( 'load', function ( event ) {

					var contents = event.target.result;

					var geometry = new THREE.UTF8Loader().parse( contents );
					var material = new THREE.MeshLambertMaterial();

					var mesh = new THREE.Mesh( geometry, material );

					editor.addObject( mesh );
					editor.select( mesh );

				}, false );
				reader.readAsBinaryString( file );

				break;
			*/

			case 'vtk':

				var reader = new FileReader();
				reader.addEventListener( 'load', function ( event ) {

					var contents = event.target.result;

					var geometry = new THREE.VTKLoader().parse( contents );
					geometry.sourceType = "vtk";
					geometry.sourceFile = file.name;

					var material = new THREE.MeshPhongMaterial();

					var mesh = new THREE.Mesh( geometry, material );
					mesh.name = filename;

					editor.addObject( mesh );
					editor.select( mesh );

				}, false );
				reader.readAsText( file );

				break;

			case 'wrl':

				var reader = new FileReader();
				reader.addEventListener( 'load', function ( event ) {

					var contents = event.target.result;

					var result = new THREE.VRMLLoader().parse( contents );

					editor.setScene( result );

				}, false );
				reader.readAsText( file );

				break;

			default:

				alert( 'Unsupported file format.' );

				break;

		}
        NProgress.done(true);

	}

	var handleJSON = function ( data, file, filename ) {

		if ( data.metadata === undefined ) { // 2.0

			data.metadata = { type: 'Geometry' };

		}

		if ( data.metadata.type === undefined ) { // 3.0

			data.metadata.type = 'Geometry';

		}

		if ( data.metadata.version === undefined ) {

			data.metadata.version = data.metadata.formatVersion;

		}

		if ( data.metadata.type.toLowerCase() === 'geometry' ) {

			var loader = new THREE.JSONLoader();
			var result = loader.parse( data );

			var geometry = result.geometry;
			var material;

			if ( result.materials !== undefined ) {

				if ( result.materials.length > 1 ) {

					material = new THREE.MeshFaceMaterial( result.materials );

				} else {

					material = result.materials[ 0 ];

				}

			} else {

				material = new THREE.MeshPhongMaterial();

			}

			geometry.sourceType = "ascii";
			geometry.sourceFile = file.name;

			var mesh;

			if ( geometry.animation && geometry.animation.hierarchy ) {

				mesh = new THREE.SkinnedMesh( geometry, material );

			} else {

				mesh = new THREE.Mesh( geometry, material );

			}

			mesh.name = filename;

			editor.addObject( mesh );
			editor.select( mesh );

		} else if ( data.metadata.type.toLowerCase() === 'object' ) {

			var loader = new THREE.ObjectLoader();
			var result = loader.parse( data );

			if ( result instanceof THREE.Scene ) {

				editor.setScene( result );

			} else {

				editor.addObject( result );
				editor.select( result );

			}

		} else if ( data.metadata.type.toLowerCase() === 'scene' ) {

			// DEPRECATED

			var loader = new THREE.SceneLoader();
			loader.parse( data, function ( result ) {

				editor.setScene( result.scene );

			}, '' );

		}

	};

}
