
// some globals
const DELAY = 1000 / 30,
    X = 0,
    Y = 1,
    Z = 2;
var gl;
var M_rot_loc;
var M_ortho_loc;
var M_camera_loc;
var M_model_loc;
var rotation = [0, 0, 0];


window.onload = function init() {
    // get the canvas handle from the document's DOM
    let canvas = document.getElementById("gl-canvas");

    // initialize webgl
    gl = initWebGL(canvas);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.5, 0.5, 0.5, 1.0);

    //  Load shader program
    let program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    // Read the teapot data
    let { verts, colors, indices, min, max } = ReadTeapot();

    // Vertex buffer
    CreateAttributeBuffer(program, "vPosition", 3);
    gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);
    // Color buffer
    CreateAttributeBuffer(program, "vColor", 3);
    gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);
    // Index Buffer
    let iBuff = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuff);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    M_model_loc = gl.getUniformLocation(program, "M_model");
    M_rot_loc = gl.getUniformLocation(program, "M_rot");
    M_ortho_loc = gl.getUniformLocation(program, "M_ortho");
    M_camera_loc = gl.getUniformLocation(program, "M_camera");

    // enable gl's depth testing
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LESS);
    gl.enable(gl.CULL_FACE);
    setModelTransform(min, max);
    setCameraTransform(
        [1, 0, 0],
        [0, 0, 0],
        [1, 1, 0]);
    setRotTransform();
    setOrthoTransformation(
        min[X] * 1.25, max[X] * 1.25,
        max[Y] * 1.25, min[Y] * 1.25,
        min[Z] * 1.25, max[Z] * 1.25);
    setOrthoTransformation(
        -100, 100,
        100, -100,
        -100, 100);

    setEventHandlers();

    requestAnimFrame(render);
};

function render(_time) {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.drawElements(gl.TRIANGLES, teapot_indices.length, gl.UNSIGNED_SHORT, 0);

    setTimeout(
        function () { requestAnimFrame(render); },
        DELAY);
}

// Set event handlers
function setEventHandlers() {
    let x_button = document.getElementById("x_button"),
        y_button = document.getElementById("y_button"),
        z_button = document.getElementById("z_button"),
        ul_button = document.getElementById("ul_button"),
        ur_button = document.getElementById("ur_button");

    x_button.onclick = function (_evt) {
        setCameraTransform(
            [1, 0, 0],
            [0, 0, 0],
            [1, 1, 0]);
    }
    y_button.onclick = function (_evt) {
        setCameraTransform(
            [0, 1, 0],
            [0, 0, 0],
            [0, 1, -1]);
    }
    z_button.onclick = function (_evt) {
        setCameraTransform(
            [0, 0, 1],
            [0, 0, 0],
            [0, 1, 1]);
    }
    ul_button.onclick = function (_evt) {
        setCameraTransform(
            [-1, 1, 1],
            [0, 0, 0],
            [-1, 2, 1]);
    }
    ur_button.onclick = function (_evt) {
        setCameraTransform(
            [1, 1, 1],
            [0, 0, 0],
            [1, 2, 1]);
    }
    // roll slider
    let roll_range = document.getElementById("roll_range"),
        reset_roll = document.getElementById("reset_roll"),

        // pitch slider
        pitch_range = document.getElementById("pitch_range"),
        reset_pitch = document.getElementById("reset_pitch"),

        // yaw slider
        yaw_range = document.getElementById("yaw_range"),
        reset_yaw = document.getElementById("reset_yaw");

    let rotationRangeUpdate = function (range_elm, axis) {
        return function (_evt) {
            rotation[axis] = range_elm.value * 0.001;
            setRotTransform();
        }
    },
        get_rotation_reset = function (range_elm, axis) {
            return function (_evt) {
                rotation[axis] = 0;
                range_elm.value = 0;
                setRotTransform();
            }
        }

    roll_range.oninput = rotationRangeUpdate(roll_range, Z);
    reset_roll.onclick = get_rotation_reset(roll_range, Z);

    pitch_range.oninput = rotationRangeUpdate(pitch_range, X);
    reset_pitch.onclick = get_rotation_reset(pitch_range, X);

    yaw_range.oninput = rotationRangeUpdate(yaw_range, Y);
    reset_yaw.onclick = get_rotation_reset(yaw_range, Y);
}

// creates attribute buffer
function CreateAttributeBuffer(program, attrbName, vecSize) {
    let buff = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buff);
    let attribLoc = gl.getAttribLocation(program, attrbName);
    gl.vertexAttribPointer(attribLoc, vecSize, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(attribLoc);

    return buff;
}

function setModelTransform(min, max) {
    let center_x = (max[X] + min[X]) / 2,
        center_y = (max[Y] + min[Y]) / 2,
        center_z = (max[Z] + min[Z]) / 2,
        M_model = translate(-center_x, -center_y, -center_z);

    // console.log("M_model", M_model);
    gl.uniformMatrix4fv(M_model_loc, false, flatten(identity4()));
}

function setRotTransform() {
    let M_roll = rotateZ(rotation[Z]),
        M_yaw = rotateY(rotation[Y]),
        M_pitch = rotateX(rotation[X]),
        M_rot = matMult(M_roll, matMult(M_yaw, M_pitch));

    // console.log("M_rot", M_rot);
    gl.uniformMatrix4fv(M_rot_loc, false, flatten(M_rot));
}

function setOrthoTransformation(left, right, top, bottom, near, far) {
    let M_p = [
        [1, 0, 0, 0],
        [0, 1, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 1],
    ],
        M_norm_scale = scale(2 / (right - left), 2 / (top - bottom), 2 / (far - near)),
        M_norm_translate = translate(-(right + left) / 2, -(top + bottom) / 2, -(far + near) / 2),
        M_norm = matMult(M_norm_scale, M_norm_translate),
        M_proj = matMult(M_p, M_norm);

    // console.log("M_proj", M_proj);
    gl.uniformMatrix4fv(M_ortho_loc, false, flatten(M_proj));
}

function setCameraTransform(from, at, up) {
    let n = CDNormalize([
        from[X] - at[X],
        from[Y] - at[Y],
        from[Z] - at[Z],
    ]),
        u = CDNormalize(cross_product(up, n)),
        v = CDNormalize(cross_product(n, u)),
        M_camera = [
            [u[X], u[Y], u[Z], 0],
            [v[X], v[Y], v[Z], 0],
            [n[X], n[Y], n[Z], 0],
            [from[X], from[Y], from[Z], 1],
        ];

    // console.log("M_camera", M_camera);
    gl.uniformMatrix4fv(M_camera_loc, false, flatten(M_camera));
}

function translate(tx, ty, tz) {
    //return mat4 transform for translating by (tx, ty, tz)
    return [
        [1.0, 0.0, 0.0, 0.0],
        [0.0, 1.0, 0.0, 0.0],
        [0.0, 0.0, 1.0, 0.0],
        [tx, ty, tz, 1.0],
    ];
}

function rotateX(theta) {
    // return mat4 transform for rotating about the X axis by theta
    var ct = Math.cos(theta),
        st = Math.sin(theta);

    return [
        [1.0, 0.0, 0.0, 0.0],
        [0.0, ct, st, 0.0],
        [0.0, -st, ct, 0.0],
        [0.0, 0.0, 0.0, 1.0],
    ];
}

function rotateY(theta) {
    // return mat4 transform for rotating about the Y axis by theta
    var ct = Math.cos(theta),
        st = Math.sin(theta);

    return [
        [ct, 0.0, -st, 0.0],
        [0.0, 1.0, 0.0, 0.0],
        [st, 0.0, ct, 0.0],
        [0.0, 0.0, 0.0, 1.0],
    ];
}

function rotateZ(theta) {
    // return mat4 transform for rotating about the Z axis by theta
    var ct = Math.cos(theta),
        st = Math.sin(theta);

    return [
        [ct, st, 0.0, 0.0],
        [-st, ct, 0.0, 0.0],
        [0.0, 0.0, 1.0, 0.0],
        [0.0, 0.0, 0.0, 1.0],
    ];
}

function scale(sx, sy, sz) {
    return [
        [sx, 0.0, 0.0, 0.0],
        [0.0, sy, 0.0, 0.0],
        [0.0, 0.0, sz, 0.0],
        [0.0, 0.0, 0.0, 1.0],
    ];
}

// create teapot
function ReadTeapot() {
    let verts = [],
        colors = [],
        min = [0, 0, 0],
        max = [0, 0, 0];

    function colorFromIndex(index) {
        switch (index % 8) {
            case 0: return [1., 0., 0.];
            case 1: return [0., 1., 0.];
            case 2: return [0., 0., 1.];
            case 3: return [0., 1., 1.];
            case 4: return [1., 0., 1.];
            case 5: return [1., 1., 0.];
            case 6: return [1., 1., 1.];
            case 7: return [0., 0., 0.];
        }
    }
    teapot_vertices.forEach((vertex, i) => {
        min[X] = Math.min(min[X], vertex[X]);
        max[X] = Math.max(max[X], vertex[X]);
        min[Y] = Math.min(min[Y], vertex[Y]);
        max[Y] = Math.max(max[Y], vertex[Y]);
        min[Z] = Math.min(min[Z], vertex[Z]);
        max[Z] = Math.max(max[Z], vertex[Z]);

        verts.push(vertex[X], vertex[Y], vertex[Z]);

        let color = colorFromIndex(i);
        colors.push(color[X], color[Y], color[Z]);
    });

    return {
        verts: new Float32Array(verts),
        colors: new Float32Array(colors),
        indices: new Uint16Array(teapot_indices),
        min,
        max,
    };
}

// New normalize function to not overwrite the normalize() function in mat_vec.js
function CDNormalize(u) {
    let len = length(u);
    if (!isFinite(len)) {
        throw "normalize: vector " + u + " has zero length";
    }
    if (len == 0)
        return [0, 0, 0];

    let u_norm = [];

    u.forEach(element => {
        u_norm.push(element / len);
    });

    return u_norm;
}