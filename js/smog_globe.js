window.addEventListener('load', prepare_data, false);

// Variables
var camera, scene, renderer;
var sphere, atmosphere;
var particle_light;

function prepare_data() {
  jsmap.load({
    fps: 25
  }).then(function(stream) {
    var frames = [];

    stream.frames.subscribe(function(frame) {
      frames.push(frame);

      if (frame.idx == stream.nframes - 1) {
        // All frames loaded, hide spinner and start WebGL globe.
        document.getElementById("spinner").className = "loaded";
        init(stream, frames);
      }
    });
  });
}

function update_texture(stream, frames, index, texture) {
  frame = frames[index];
  canvas = document.getElementById("texture_canvas");

  var width = stream.size.width;
  var height = stream.size.height;

  canvas.width = width;
  canvas.height = height;
  ctx = canvas.getContext("2d");
  var imageData = ctx.createImageData(width, height);

  var pout = 0;
  var colors = stream.lut.vcolors;
  var matrix = frame.matrix;
  for (var y = 0; y < height; y += 1) {
    var pin = width * (height - y - 1);
    for (var x = 0; x < width; x += 1, pin += 1) {
      var idx = matrix[pin];
      var color = colors[idx];
      imageData.data[pout++] = (color >> 16) & 0xff;
      imageData.data[pout++] = (color >> 8) & 0xff;
      imageData.data[pout++] = color & 0xff;
      imageData.data[pout++] = idx ? 255 : 0;
    }
  }
  ctx.putImageData(imageData, 0, 0);

  // TODO WebGL would like the canvas to have a power of 2 size..
  // Otherwise warns and automatically resizes (so its not critical)

  texture.needsUpdate = true;

  setTimeout(function() {
    update_texture(stream, frames, (index+1) % stream.nframes, texture);
	}, 50);
}

function init(stream, frames) {
  // set up the scene, the camera and the renderer
  create_scene();

  // create the objects
  sphere = create_sphere(5, 32);
  scene.add(sphere);

  atmosphere = create_atmosphere(5, 32, stream, frames);
  scene.add(atmosphere);

  // add lights
  create_lights();

  // start a loop that will update the objects' positions
  // and render the scene on each frame
  loop();
}

function create_scene() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.y = 5;
  camera.position.z = 10;
  camera.lookAt(new THREE.Vector3(0, 0, 0));

  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
}

function create_sphere(radius, segments) {
  var geometry = new THREE.SphereGeometry(radius, segments, segments);

  var earth_texture = new THREE.TextureLoader().load("textures/earth_4k.jpg");
  var bump_texture = new THREE.TextureLoader().load("textures/elev_bump_4k.jpg");
  var specular_texture = new THREE.TextureLoader().load("textures/water_4k.png");

  var material = new THREE.MeshPhongMaterial({
    map: earth_texture,
    bumpMap: bump_texture,
    bumpScale: 0.005,
    specularMap: specular_texture,
    specular: new THREE.Color('grey')
  });

  return new THREE.Mesh(geometry, material);
}

function create_atmosphere(radius, segments, stream, frames) {
  var geometry = new THREE.SphereGeometry(radius, segments, segments);
  var texture = new THREE.Texture(document.getElementById("texture_canvas"));

  update_texture(stream, frames, 0, texture);

  var material = new THREE.ShaderMaterial({
    uniforms: {
      texture: {
        type: "t",
        value: texture
      },
      glow_color: {
        type: "c",
        value: new THREE.Color(0xffffff)
      }
    },
    vertexShader: document.getElementById('vertex_shader').textContent,
    fragmentShader: document.getElementById('fragment_shader').textContent,
    transparent: true
  });

  atmosphere = new THREE.Mesh(geometry, material.clone());
  atmosphere.scale.multiplyScalar(1.025);

  return atmosphere;
}

function create_lights() {
  var hemisphere_light = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.25);
  scene.add(hemisphere_light);

  var directional_light = new THREE.DirectionalLight(0xffffff, 0.5);
  directional_light.position.set(1, 1, 1);
  scene.add(directional_light);
}

function loop() {
  requestAnimationFrame(loop);

  sphere.rotateY(0.01);
  atmosphere.rotateY(0.01);

  renderer.render(scene, camera);
}
