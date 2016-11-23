window.addEventListener('load', prepare_data, false);

// Variables
var camera, scene, renderer;
var sphere, smog, atmosphere;
var particle_light;

var start = Date.now();

function prepare_data() {
  frames_ls = localStorage.getItem("frames");
  stream_ls = localStorage.getItem("stream");

  if (frames_ls == null || stream_ls == null) {
    jsmap.load({
      fps: 1000
    }).then(function(stream) {
      var frames = [];

      stream.frames.subscribe(function(frame) {
        frames.push(frame);

        if (frame.idx == stream.nframes - 1) {
          // All frames loaded, hide spinner and start WebGL globe.
          document.getElementById("spinner").className = "loaded";

          // Save current forecast to localstorage
          // TODO unfortunately frames can't be serialized in this way as it would be too big
          //localStorage.setItem("frames", jQuery.stringify(frames));
          //localStorage.setItem("stream", jQuery.stringify(stream));

          init(stream, frames);
        }
      });
    });
  } else {
    frames = jQuery.parseJSON(frames_ls);
    stream = jQuery.parseJSON(stream_ls);

    // All frames loaded, hide spinner and start WebGL globe.
    document.getElementById("spinner").className = "loaded";

    init(stream, frames);
  }
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
  var matrix = frame.matrix;

  for (var y = 0; y < height; y += 1) {
    var pin = width * (height - y - 1);
    for (var x = 0; x < width; x += 1, pin += 1) {
      var idx = matrix[pin];
      var aqi = stream.lut.aqi[idx];
      imageData.data[pout++] = 0;
      imageData.data[pout++] = 0;
      imageData.data[pout++] = 0;
      // Let the minimum opacity given any air pollution be 100/255.
      // Once the index surpasses 300 (even though the maximum is 500),
      // we set 255/255 opacity.
      imageData.data[pout++] = idx ? 100 + Math.round(155 * (aqi / 300.0)) : 0;
    }
  }

  // Blur
  StackBlur.imageDataRGBA(imageData, 0, 0, width, height, 1);

  ctx.putImageData(imageData, 0, 0);

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

  atmosphere = create_atmosphere(5, 32);
  scene.add(atmosphere);

  smog = create_smog(5, 7, stream, frames);
  scene.add(smog);

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

function create_smog(radius, detail, stream, frames) {
  var geometry = new THREE.IcosahedronGeometry(radius, detail);
  var texture = new THREE.Texture(document.getElementById("texture_canvas"));

  // texture.anisotropy = 16;
  texture.minFilter = THREE.LinearFilter;

  update_texture(stream, frames, 0, texture);

  var material = new THREE.ShaderMaterial({
    uniforms: {
      texture: {
        type: "t",
        value: texture
      },
      time: {
        type: "f",
        value: 0.0
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

  smog = new THREE.Mesh(geometry, material.clone());
  smog.scale.multiplyScalar(1.15);

  return smog;
}

function create_atmosphere(radius, segments) {
  var geometry = new THREE.SphereGeometry(radius, segments, segments);

  var material = new THREE.ShaderMaterial({
    uniforms : {
      glow_color: {type: "c", value: new THREE.Color(0xffffff)}
    },
    vertexShader:   document.getElementById('vertex_shader_atmosphere').textContent,
    fragmentShader: document.getElementById('fragment_shader_atmosphere').textContent,
    transparent: true
  });


  atmosphere = new THREE.Mesh(geometry, material.clone());
  atmosphere.scale.multiplyScalar(1.05);

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

  sphere.rotateY(0.005);
  smog.rotateY(0.005);

  smog.material.uniforms["time"].value = 0.0001 * (Date.now() - start);

  renderer.render(scene, camera);
}
