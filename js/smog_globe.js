window.addEventListener('load', init, false);

// Variables
var camera, scene, renderer;
var sphere, atmosphere;
var particle_light;

function init() {
  // set up the scene, the camera and the renderer
  create_scene();

  // create the objects
  sphere = create_sphere(5, 32);
  scene.add(sphere);

  atmosphere = create_atmosphere(5, 32);
  scene.add(atmosphere);

  // add lights
  create_lights();

  // start a loop that will update the objects' positions
  // and render the scene on each frame
  loop();
}

function create_scene() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
  camera.position.y = 5;
  camera.position.z = 10;
  camera.lookAt(new THREE.Vector3(0,0,0));

  renderer = new THREE.WebGLRenderer();
  renderer.setSize( window.innerWidth, window.innerHeight );
  document.body.appendChild( renderer.domElement );
}

function create_sphere(radius, segments) {
  var geometry = new THREE.SphereGeometry(radius, segments, segments);

  var earth_texture = new THREE.TextureLoader().load("textures/earth_4k.jpg");
  var bump_texture = new THREE.TextureLoader().load("textures/elev_bump_4k.jpg");
  var specular_texture = new THREE.TextureLoader().load("textures/water_4k.png");

  var material = new THREE.MeshPhongMaterial({
    map:         earth_texture,
    bumpMap:     bump_texture,
    bumpScale:   0.005,
    specularMap: specular_texture,
    specular:    new THREE.Color('grey')
  });

  return new THREE.Mesh(geometry, material);
}

function create_atmosphere(radius, segments) {
  var geometry = new THREE.SphereGeometry(radius, segments, segments);

  var material = new THREE.ShaderMaterial({
    uniforms : {
      glow_color: {type: "c", value: new THREE.Color(0xffffff)}
    },
    vertexShader:   document.getElementById('vertex_shader').textContent,
    fragmentShader: document.getElementById('fragment_shader').textContent,
    transparent: true
  });

  atmosphere = new THREE.Mesh(geometry, material.clone());
  atmosphere.scale.multiplyScalar(1.1);

  return atmosphere;
}

function create_lights() {
  var hemisphere_light = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.25 );
	scene.add(hemisphere_light);

  var directional_light = new THREE.DirectionalLight( 0xffffff, 0.5 );
	directional_light.position.set( 1, 1, 1 );
	scene.add(directional_light);
}

function loop() {
  requestAnimationFrame(loop);

  sphere.rotateY(0.01);

  renderer.render(scene, camera);
}
