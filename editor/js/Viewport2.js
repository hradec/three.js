



var Viewport = function ( editor ) {

    var signals = editor.signals;

	var container = new UI.Panel();
	container.setPosition( 'absolute' );

	var info = new UI.Text();
	info.setPosition( 'absolute' );
	info.setRight( '5px' );
	info.setBottom( '5px' );
	info.setFontSize( '12px' );
	info.setColor( '#ffffff' );
	info.setValue( 'objects: 0, vertices: 0, faces: 0' );
	container.add( info );

	var scene = editor.scene;
	var sceneHelpers = editor.sceneHelpers;
    var composer;

	var objects = [];


	// helpers

    var grid = new THREE.GridHelper( 200, 25 );
    //var grid = new THREE.Plane( 200, 25 );
    var geometry    = new THREE.PlaneGeometry( 200, 180, 10, 10 );
    var m           = new THREE.Matrix4();
    var quaternion  = new THREE.Quaternion();
    quaternion.setFromAxisAngle( new THREE.Vector3( 1, 0, 0 ), Math.PI / 2 );
    m.compose( new THREE.Vector3( 0, -0.01, 0 ), quaternion, new THREE.Vector3( 1, 1, 1 ) );
    geometry.applyMatrix(m);
    
    //texture = THREE.ImageUtils.loadTexture('crate.gif');
    var material = new THREE.ShaderMaterial({
            uniforms: {  },
            vertexShader: [
                "varying vec2 vUv;",
        		"void main() {",
                    "vUv=uv;",
        			"gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",
        		"}"
        	].join("\n"),
        	fragmentShader: [
                "uniform sampler2D texture1;",
                "varying vec2 vUv;",
        		"void main() {",
                    "float fadeEdge=(1.0-abs(vUv.x*2.0-1.0)) * (1.0-abs(vUv.y*2.0-1.0));",
        			"gl_FragColor = vec4(0.5,0.5,1.0,smoothstep(0.0,0.1,fadeEdge)*0.5);",
        		"}"
        	].join("\n")
    });    
    material.side = THREE.DoubleSide;
    //material.opacity = 0.5;
    material.transparent = true;
    //var material = new THREE.MeshBasicMaterial( {color: 0x555555, side: THREE.DoubleSide} );
    var plane = new THREE.Mesh( geometry, material );
    
    window.grid = grid;
    sceneHelpers.add( plane );
    //scene.add( grid );

	//
    
    var SCREEN_WIDTH = window.innerWidth;
    var SCREEN_HEIGHT = window.innerHeight;

	var camera = new THREE.PerspectiveCamera( 50, 1, 1, 5000 );
    //camera = new THREE.OrthographicCamera( -SCREEN_WIDTH/2, SCREEN_WIDTH/2, SCREEN_HEIGHT/2, -SCREEN_HEIGHT/2, -0.5, 5000 );

	camera.position.fromArray( editor.config.getKey( 'camera' ).position );
	camera.lookAt( new THREE.Vector3().fromArray( editor.config.getKey( 'camera' ).target ) );

	//

	var selectionBox = new THREE.BoxHelper();
	selectionBox.material.depthTest = false;
	selectionBox.material.transparent = true;
	selectionBox.visible = false;
	sceneHelpers.add( selectionBox );

	var transformControls = new THREE.TransformControls( camera, container.dom );
	transformControls.addEventListener( 'change', function () {

		controls.enabled = true;

		if ( transformControls.axis !== null ) {

			controls.enabled = false;

		}

		if ( editor.selected !== null ) {

			signals.objectChanged.dispatch( editor.selected );

		}

	} );
	sceneHelpers.add( transformControls );

	// fog

	var oldFogType = "None";
	var oldFogColor = 0xaaaaaa;
	var oldFogNear = 1;
	var oldFogFar = 5000;
	var oldFogDensity = 0.00025;

	// object picking

	var ray = new THREE.Raycaster();
	var projector = new THREE.Projector();

	// events

	var getIntersects = function ( event, object ) {

		var rect = container.dom.getBoundingClientRect();
		x = ( event.clientX - rect.left ) / rect.width;
		y = ( event.clientY - rect.top ) / rect.height;
		var vector = new THREE.Vector3( ( x ) * 2 - 1, - ( y ) * 2 + 1, 0.5 );

		projector.unprojectVector( vector, camera );

		ray.set( camera.position, vector.sub( camera.position ).normalize() );

		if ( object instanceof Array ) {

			return ray.intersectObjects( object );

		}

		return ray.intersectObject( object );

	};

	var onMouseDownPosition = new THREE.Vector2();
	var onMouseUpPosition = new THREE.Vector2();

	var onMouseDown = function ( event ) {

		event.preventDefault();

		var rect = container.dom.getBoundingClientRect();
		x = (event.clientX - rect.left) / rect.width;
		y = (event.clientY - rect.top) / rect.height;
		onMouseDownPosition.set( x, y );

		document.addEventListener( 'mouseup', onMouseUp, false );

	};

	var onMouseUp = function ( event ) {

		var rect = container.dom.getBoundingClientRect();
		x = (event.clientX - rect.left) / rect.width;
		y = (event.clientY - rect.top) / rect.height;
		onMouseUpPosition.set( x, y );

		if ( onMouseDownPosition.distanceTo( onMouseUpPosition ) == 0 ) {

			var intersects = getIntersects( event, objects );
            
            console.log(intersects)
			if ( intersects.length > 0 ) {

				var object = intersects[ 0 ].object;

				if ( object.userData.object !== undefined ) {

					// helper

					editor.select( object.userData.object );

				} else {

					editor.select( object );

				}

			} else {

				editor.select( null );

			}

			render();

		}

		document.removeEventListener( 'mouseup', onMouseUp );

	};

	var onDoubleClick = function ( event ) {

		var intersects = getIntersects( event, objects );

		if ( intersects.length > 0 && intersects[ 0 ].object === editor.selected ) {

			controls.focus( editor.selected );

		}

	};

	container.dom.addEventListener( 'mousedown', onMouseDown, false );
	container.dom.addEventListener( 'dblclick', onDoubleClick, false );

	// controls need to be added *after* main logic,
	// otherwise controls.enabled doesn't work.

	var controls = new THREE.EditorControls( camera, container.dom );
	controls.center.fromArray( editor.config.getKey( 'camera' ).target )
	controls.addEventListener( 'change', function () {

		transformControls.update();
		signals.cameraChanged.dispatch( camera );

	} );
    
    document.addEventListener( 'keydown', function ( event ) {
            	var signals = editor.signals;

				switch ( event.keyCode ) {
                    case 70:
                        controls.focus( editor.selected, true );
                        break;
                    case 65:
                        if(editor.scene.children.length > 0){
                            //console.log(editor.scene);
                            controls.focus( editor.scene.children, true );
                        }else{
                            controls.focus( null );
                        }
                        break;

				}

			}, false );


	// signals

	signals.themeChanged.add( function ( value ) {

		switch ( value ) {

			case 'css/light.css':
				grid.setColors( 0x444444, 0x888888 );
				clearColor = 0xaaaaaa;
				break;
			case 'css/dark.css':
				grid.setColors( 0xbbbbbb, 0x888888 );
				clearColor = 0x333333;
				break;

		}
		
		renderer.setClearColor( clearColor );

		render();

	} );

	signals.transformModeChanged.add( function ( mode ) {

		transformControls.setMode( mode );

	} );

	signals.snapChanged.add( function ( dist ) {

		transformControls.setSnap( dist );

	} );

	signals.spaceChanged.add( function ( space ) {

		transformControls.setSpace( space );

	} );

	signals.rendererChanged.add( function ( type ) {

		container.dom.removeChild( renderer.domElement );

		renderer = new THREE[ type ]( { antialias: false } );
		renderer.autoClear = false;
		renderer.autoUpdateScene = false;
		renderer.setClearColor( clearColor );
		renderer.setSize( container.dom.offsetWidth, container.dom.offsetHeight );

		container.dom.appendChild( renderer.domElement );
        
		render();

	} );

	signals.sceneGraphChanged.add( function () {

		render();
		updateInfo();

	} );

	var saveTimeout;

	signals.cameraChanged.add( function () {

		if ( saveTimeout !== undefined ) {

			clearTimeout( saveTimeout );

		}

		saveTimeout = setTimeout( function () {

			editor.config.setKey( 'camera', {
				position: camera.position.toArray(),
				target: controls.center.toArray()
			} );

		}, 1000 );

		render();

	} );

	signals.objectSelected.add( function ( object ) {

		selectionBox.visible = false;
		transformControls.detach();

		if ( object !== null ) {

			if ( object.geometry !== undefined &&
				 object instanceof THREE.Sprite === false ) {

				selectionBox.update( object );
				selectionBox.visible = true;

			}

			if ( object instanceof THREE.PerspectiveCamera === false ) {

				transformControls.attach( object );

			}

		}

		render();

	} );

	signals.objectAdded.add( function ( object ) {

		var materialsNeedUpdate = false;

		object.traverse( function ( child ) {

			if ( child instanceof THREE.Light ) materialsNeedUpdate = true;

			objects.push( child );

		} );

		if ( materialsNeedUpdate === true ) updateMaterials();

	} );

	signals.objectChanged.add( function ( object ) {

		transformControls.update();

		if ( object !== camera ) {

			if ( object.geometry !== undefined ) {

				selectionBox.update( object );

			}

			if ( editor.helpers[ object.id ] !== undefined ) {

				editor.helpers[ object.id ].update();

			}

			updateInfo();

		}

		render();

	} );

	signals.objectRemoved.add( function ( object ) {

		var materialsNeedUpdate = false;

		object.traverse( function ( child ) {

			if ( child instanceof THREE.Light ) materialsNeedUpdate = true;

			objects.splice( objects.indexOf( child ), 1 );

		} );

		if ( materialsNeedUpdate === true ) updateMaterials();

	} );

	signals.helperAdded.add( function ( object ) {

		objects.push( object.getObjectByName( 'picker' ) );

	} );

	signals.helperRemoved.add( function ( object ) {

		objects.splice( objects.indexOf( object.getObjectByName( 'picker' ) ), 1 );

	} );

	signals.materialChanged.add( function ( material ) {

		render();

	} );

	signals.fogTypeChanged.add( function ( fogType ) {

		if ( fogType !== oldFogType ) {

			if ( fogType === "None" ) {

				scene.fog = null;

			} else if ( fogType === "Fog" ) {

				scene.fog = new THREE.Fog( oldFogColor, oldFogNear, oldFogFar );

			} else if ( fogType === "FogExp2" ) {

				scene.fog = new THREE.FogExp2( oldFogColor, oldFogDensity );

			}

			updateMaterials();

			oldFogType = fogType;

		}

		render();

	} );

	signals.fogColorChanged.add( function ( fogColor ) {

		oldFogColor = fogColor;

		updateFog( scene );

		render();

	} );

	signals.fogParametersChanged.add( function ( near, far, density ) {

		oldFogNear = near;
		oldFogFar = far;
		oldFogDensity = density;

		updateFog( scene );

		render();

	} );

	signals.windowResize.add( function () {

		camera.aspect = container.dom.offsetWidth / container.dom.offsetHeight;
		camera.updateProjectionMatrix();

		renderer.setSize( container.dom.offsetWidth, container.dom.offsetHeight );

		render();

	} );

	var animations = [];

	signals.playAnimation.add( function ( animation ) {

		animations.push( animation );

	} );

	signals.stopAnimation.add( function ( animation ) {

		var index = animations.indexOf( animation );

		if ( index !== -1 ) {

			animations.splice( index, 1 );

		}

	} );

	//

	var clearColor, renderer;

	if ( editor.config.getKey( 'renderer' ) !== undefined ) {

		renderer = new THREE[ editor.config.getKey( 'renderer' ) ]( { antialias: false } );

	} else {

		if ( System.support.webgl === true ) {

			renderer = new THREE.WebGLRenderer( { antialias: false } );

		} else {

			renderer = new THREE.CanvasRenderer();

		}

	}

	renderer.autoClear = false;
	renderer.autoUpdateScene = false;
	container.dom.appendChild( renderer.domElement );


        var width = window.innerWidth || 1;
		var height = window.innerHeight || 1;
		var parameters = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBFormat, stencilBuffer: false };

/*
    var renderTargetDepth =  new THREE.WebGLRenderTarget( width, height, parameters );
    var sscene = scene;
    sscene.overrideMaterial = depthMaterial;
    console.log(depthMaterial);
    console.log(sscene.overrideMaterial);
	renderer.render( sscene, camera, renderTargetDepth, true );
*/


        
        slicer = new THREE.ShaderMaterial({
        
            uniforms: {},
        
        	vertexShader: [
        
        		"void main() {",
        
        			"gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",
        
        		"}"
        
        	].join("\n"),
        
        	fragmentShader: [
        
        		"void main() {",
        
        			"gl_FragColor = vec4(1.0,0.0,0.0, 1.0 );",
        
        		"}"
        
        	].join("\n")
        
        });


        composer = new THREE.EffectComposer( renderer );
        
        var depthMaterial = new THREE.MeshDepthMaterial();
        //var renderPass = new THREE.RenderPass( scene,  new THREE.OrthographicCamera( -300, 300, 300, -300, -1, 1 ), depthMaterial );
        var renderPass = new THREE.RenderPass( scene,  camera, slicer );
    	composer.addPass( renderPass );
        
        var renderTargetDepth =  composer.renderTarget1.clone();
		var effect = new THREE.SavePass( renderTargetDepth );
	    composer.addPass( effect );

        var renderPass = new THREE.RenderPass( scene, camera );
        //composer.addPass( renderPass );


    EdgeShader2 = {
    
        uniforms: {
    
    		"tDiffuse": { type: "t", value: null },
    		"aspect":    { type: "v2", value: new THREE.Vector2( 512, 512 ) },
    	},
    
    	vertexShader: [
    
    		"varying vec2 vUv;",
    
    		"void main() {",
    
    			"vUv = uv;",
    			"gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",
    
    		"}"
    
    	].join("\n"),
    
    	fragmentShader: [
    
    		"uniform sampler2D tDiffuse;",
    		"varying vec2 vUv;",
    		"uniform vec2 aspect;",
    
    
    		"vec2 texel = vec2(1.0 / aspect.x, 1.0 / aspect.y);",
    
    		"mat3 G[2];",
    
    		"const mat3 g0 = mat3( 1.0, 2.0, 1.0, 0.0, 0.0, 0.0, -1.0, -2.0, -1.0 );",
    		"const mat3 g1 = mat3( 1.0, 0.0, -1.0, 2.0, 0.0, -2.0, 1.0, 0.0, -1.0 );",
    
    
    		"void main(void)",
    		"{",
    			"mat3 I;",
    			"float cnv[2];",
    			"vec3 sample;",
    
    			"G[0] = g0;",
    			"G[1] = g1;",
    
    			/* fetch the 3x3 neighbourhood and use the RGB vector's length as intensity value */
    			"for (float i=0.0; i<3.0; i++)",
    			"for (float j=0.0; j<3.0; j++) {",
    				"sample = texture2D( tDiffuse, vUv + texel * vec2(i-1.0,j-1.0) ).rgb;",
    				"I[int(i)][int(j)] = length(sample);",
    			"}",
    
    			/* calculate the convolution values for all the masks */
    			"for (int i=0; i<2; i++) {",
    				"float dp3 = dot(G[i][0], I[0]) + dot(G[i][1], I[1]) + dot(G[i][2], I[2]);",
    				"cnv[i] = dp3 * dp3; ",
    			"}",
    
    			"gl_FragColor = vec4(0.5 * sqrt(cnv[0]*cnv[0]+cnv[1]*cnv[1]))+texture2D( tDiffuse, vUv);",
    		"} ",
    
    	].join("\n")
    
    };

        var effect = new THREE.ShaderPass( EdgeShader2 );
        effect.uniforms["aspect"].value = new THREE.Vector2( width, height );
        effect.renderToScreen = true;
        composer.addPass( effect );
        

        comp = new THREE.ShaderMaterial({
            uniforms: {},
            vertexShader: [
        	    "varying vec2 vUv;",
        		"void main() {",
        			"vUv = uv;",
        			"gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",
        		"}"
        	].join("\n"),
        	fragmentShader: [
            	"uniform sampler2D tDiffuse;",
        		"varying vec2 vUv;",
        		"void main() {",
        			"vec4 texel = texture2D( tDiffuse, vUv );",
        			"gl_FragColor = texel;",
        		"}"
        	].join("\n")
        
        });

        var effect2 = new THREE.ShaderPass( comp );
        effect2.renderToScreen = true;
        //composer.addPass( effect2 );

        //var effectBloom = new THREE.BloomPass( 1.25 );
    	//var effectFilm = new THREE.FilmPass( 0.0, 0.95, 1024, false );
        //effectFilm.renderToScreen = true;
        //composer.addPass( effectBloom );




	animate();

	//

	function updateInfo() {

		var objects = 0;
		var vertices = 0;
		var faces = 0;

		scene.traverse( function ( object ) {

			if ( object instanceof THREE.Mesh ) {

				objects ++;

				var geometry = object.geometry;

				if ( geometry instanceof THREE.Geometry ) {

					vertices += geometry.vertices.length;
					faces += geometry.faces.length;

				} else if ( geometry instanceof THREE.BufferGeometry ) {

					vertices += geometry.attributes.position.array.length / 3;

					if ( geometry.attributes.index !== undefined ) {

						faces += geometry.attributes.index.array.length / 3;

					} else {

						faces += geometry.attributes.position.array.length / 9;

					}

				}

			}

		} );

		info.setValue( 'objects: ' + objects + ', vertices: ' + vertices + ', faces: ' + faces );

	}

	function updateMaterials() {

		editor.scene.traverse( function ( node ) {

			if ( node.material ) {

				node.material.needsUpdate = true;

				if ( node.material instanceof THREE.MeshFaceMaterial ) {

					for ( var i = 0; i < node.material.materials.length; i ++ ) {

						node.material.materials[ i ].needsUpdate = true;

					}

				}

			}

		} );

	}

	function updateFog( root ) {

		if ( root.fog ) {

			root.fog.color.setHex( oldFogColor );

			if ( root.fog.near !== undefined ) root.fog.near = oldFogNear;
			if ( root.fog.far !== undefined ) root.fog.far = oldFogFar;
			if ( root.fog.density !== undefined ) root.fog.density = oldFogDensity;

		}

	}

	function animate() {

		requestAnimationFrame( animate );

		// animations

		if ( THREE.AnimationHandler.animations.length > 0 ) {

			THREE.AnimationHandler.update( 0.016 );

			for ( var i = 0, l = sceneHelpers.children.length; i < l; i ++ ) {

				var helper = sceneHelpers.children[ i ];

				if ( helper instanceof THREE.SkeletonHelper ) {

					helper.update();

				}

			}

			render();

		}

	}

	function render() {

		sceneHelpers.updateMatrixWorld();
		scene.updateMatrixWorld();

		renderer.clear();
		renderer.render( scene, camera );

		if ( renderer instanceof THREE.RaytracingRenderer === false ) {

			renderer.render( sceneHelpers, camera );

		}

	}

	return container;

}