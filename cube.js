// some globals
var gl;
var xformLoc;
var thetaLoc;

const vertices = new Float32Array([
	-0.1, -0.1, 0.1,
	-0.1, 0.1, 0.1,
	0.1, 0.1, 0.1,
	0.1, -0.1, 0.1,
	-0.1, -0.1, -0.1,
	-0.1, 0.1, -0.1,
	0.1, 0.1, -0.1,
	0.1, -0.1, -0.1,
]);
const colors = new Float32Array([
	0.0, 0.0, 0.0,  // black
	1.0, 0.0, 0.0,  // red
	1.0, 1.0, 0.0,  // yellow
	0.0, 1.0, 0.0,  // green
	0.0, 0.0, .69,  // blue
	1.0, 0.0, 1.0,  // magenta
	0.0, 1.0, 1.0,  // cyan
	1.0, 1.0, 1.0,  // white
	0.5, 0.5, 0
]);
const indices = new Uint8Array([
	1, 0, 3,
	3, 2, 1,
	2, 3, 7,
	7, 6, 2,
	3, 0, 4,
	4, 7, 3,
	6, 5, 1,
	1, 2, 6,
	4, 5, 6,
	6, 7, 4,
	5, 4, 0,
	0, 1, 5,
]);

window.onload = function init() {
	// get the canvas handle from the document's DOM
	let canvas = document.getElementById("gl-canvas");
	gl = initWebGL(canvas);

	gl.viewport(0, 0, canvas.width, canvas.height);
	gl.clearColor(0.5, 0.5, 0, 1.0);
	gl.enable(gl.DEPTH_TEST);
	gl.depthFunc(gl.LESS);

	let program = initShaders(gl, "vertex-shader", "fragment-shader");
	// make this program the current shader program
	gl.useProgram(program);

	// vertex buffer   
	var vBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
	var vPosition = gl.getAttribLocation(program, "vPosition");
	gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vPosition);
	gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

	// color buffer
	var cBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
	var vColor = gl.getAttribLocation(program, "vColor");
	gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vColor);
	gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);

	// index buffer
	var iBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

	xformLoc = gl.getUniformLocation(program, "xform");

	requestAnimFrame(render);
};

function render(time) {
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	let theta = time * 0.001;

	// generate identity transform and load to GPU xformLoc
	// render the cube (center)
	DrawCube(identity4());
	// DrawCube(rotateX(theta));
	// DrawCube(rotateY(theta));
	// DrawCube(rotateZ(theta));


	// generate transform:
	let transform =
		//   rotateX(theta)
		matMult(rotateX(theta),
			//   * translate towards Y by 0.5
			matMult(translate(0, 0.5, 0),
				//   * rotateX(theta)
				rotateX(theta)));
	// load transform to GPU xformLoc
	// render the cube (X rotation)
	DrawCube(transform);


	// generate transform:
	//   rotateX(theta)
	//   * translate towards Y by 0.5
	//   * rotateX(theta)
	// load transform to GPU xformLoc
	// render the cube (X rotation)
	transform = matMult(rotateY(theta), matMult(translate(0.5, 0, 0), rotateY(theta)));
	DrawCube(transform);

	// generate transform:
	//   rotateX(theta)
	//   * translate towards Y by 0.5
	//   * rotateX(theta)
	// load transform to GPU xformLoc
	// render the cube (X rotation)
	transform = matMult(rotateZ(theta), matMult(translate(0.5, 0.5, 0.5), rotateZ(theta)));
	DrawCube(transform);

	requestAnimFrame(render);
}

function DrawCube(xform) {
	gl.uniformMatrix4fv(xformLoc, false, flatten(xform));
	gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_BYTE, 0);
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
		[ct, 0.0, st, 0.0],
		[0.0, 1.0, 0.0, 0.0],
		[-st, 0.0, ct, 0.0],
		[0.0, 0.0, 0.0, 1.0],
	];
}

function rotateZ(theta) {
	// return mat4 transform for rotating about the Z axis by theta
	var ct = Math.cos(theta),
		st = Math.sin(theta);

	return [
		[ct, -st, 0.0, 0.0],
		[st, ct, 0.0, 0.0],
		[0.0, 0.0, 1.0, 0.0],
		[0.0, 0.0, 0.0, 1.0],
	];
}