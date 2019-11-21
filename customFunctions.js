var size = 10;

const direction = {
	FORWARD: vec3.fromValues(0, 0, 1),
	BACKWARD: vec3.fromValues(0, 0, -1),
	UP: vec3.fromValues(0, 1, 0),
	DOWN: vec3.fromValues(0, -1, 0),
	LEFT: vec3.fromValues(-1, 0, 0),
	RIGHT: vec3.fromValues(1, 0, 0),
}

//create a 3d matrix of size
function generateScene(glContext, vertShader, fragShader) {
    var scene = {
		objects: {
			forward: [],
			backward: [],
			up: [],
			down: [],
			left: [],
			right: [],
		},
		objectPositions: {
			forward: {},
			backward: {},
			up: {},
			down: {},
			left: {},
			right: {},
		},
		gravityDirection: direction.DOWN,
		mainObject: null, //new Model(glContext, "main") ?? how to load .obj into this class?
    }	

	var count = 0;
	let scale = vec3.fromValues(.5, .5, .5);
	// ambient, diffuse, specular, n, alpha 
	let ambient = vec3.fromValues(1,1,1);
	let diffuse = vec3.fromValues(1,1,1);
	let specular = vec3.fromValues(1,1,1);
	let n = 5.0;
	let alpha = 1.0;
	for (var i = 1; i < size - 1; i++)
	{
		for (var j = 1; i < size - 1; i++)
		{//glContext, name, parent = null, ambient, diffuse, specular, n, alpha, texture, textureNorm
			let position = vec3.fromValues(i, j, size);
			let	temp = createCube(glContext, "FaceFront"+ ((i + j * size).toString()), ambient, diffuse, specular, n, alpha, scale, position, vertShader, fragShader);
			scene.objects.forward.push(temp);

			position = vec3.fromValues(i, j, 0);
			temp = createCube(glContext, "FaceBack"+ ((i + j * size).toString()), ambient, diffuse, specular, n, alpha, scale, position, vertShader, fragShader);
			scene.objects.backward.push(temp);

		}
	}
    // for (var i = 0; i < size; i += 1) {
    //     scene.world.push([]);
    //     for (var j = 0; j < size; j += 1) {
	// 		scene.world[i].push([]);
    //         for (var k = 0; k < size; k += 1) {
	// 			let newCube = new Cube(glContext, "WorldCube"+ ((count).toString()));
	// 			newCube.position = vec3.fromValues(i, j, k);
	// 			newCube.vertShader = vertShader;
	// 			newCube.fragShader = fragShader;
	// 			//newCube.texture = "./materials/plywood.jpg";
	// 			newCube.setup();

	// 			count++;

	// 			scene.world[i][j].push({
	// 				...newCube,
	// 			});
    //         }
    //     }
    // }
	console.log(scene.world);
	return scene;
}

//whatever
function createCube(glContext, name, ambient, diffuse, specular, n, alpha, position, scale, vertShader, fragShader)
{
	let cube = new Cube(glContext, name, null, ambient, diffuse, specular, n, alpha);
	cube.scale = scale;
	cube.vertShader = vertShader;
	cube.fragShader = fragShader;

	return cube
}