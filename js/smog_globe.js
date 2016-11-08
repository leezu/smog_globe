window.addEventListener('load', init, false);

// Variables
var camera, scene, renderer;
var particle_light;

function init() {
  // set up the scene, the camera and the renderer
  createScene();

  // create the objects
  var sphere = createSphere(5, 32);

  // add the objects
  scene.add(sphere);

  // add lights
  createLights();

  // start a loop that will update the objects' positions
  // and render the scene on each frame
  loop();
}

function createScene() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
  camera.position.z = 10;

  renderer = new THREE.WebGLRenderer();
  renderer.setSize( window.innerWidth, window.innerHeight );
  document.body.appendChild( renderer.domElement );
}

function createSphere(radius, segments) {
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

function createLights() {
  var hemisphere_light = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.25 );
	scene.add(hemisphere_light);

  var directional_light = new THREE.DirectionalLight( 0xffffff, 0.5 );
	directional_light.position.set( 1, 1, 1 );
	scene.add(directional_light);
}

function loop() {
  requestAnimationFrame(loop);
  renderer.render(scene, camera);
}
