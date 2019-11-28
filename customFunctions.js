var size = 8;

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
			modelCenter: [],
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
		centerObject: {},
		playerObject: {},
    }	

	var count = 0;
	let scale = vec3.fromValues(2.0, 2.0, 2.0);
	// ambient, diffuse, specular, n, alpha 
	let ambient = vec3.fromValues(0.5,0.5,0.5);
	let diffuse = vec3.fromValues(0.5,0.5,0.5);
	let specular = vec3.fromValues(1.0,1.0,1.0);
	let n = 5.0;
	let alpha = 0.15;

	let centerPos =  vec3.fromValues(1 + 0.1, 1 + 0.1, 1 + 0.1);
	let centerScale = vec3.fromValues(1.0, 1.0, 1.0);
	let fakeCenterScale = vec3.fromValues(size * 2 - 4 - 0.4, size * 2 - 4 - 0.4, size * 2 - 4 - 0.4);
	let centerColor = vec3.fromValues(0.8, 0.2, 0.1);
	scene.centerObject = createCube(glContext, "Center", null, centerColor, diffuse, specular, n, 0.0, centerPos, centerScale, vertShader, fragShader);
	scene.objects.modelCenter.push(createCube(glContext, "FakeCenter", scene.centerObject, centerColor, diffuse, specular, n, 1.0, centerPos, fakeCenterScale, vertShader, fragShader));
	//scene.centerObject.centroid = vec3.fromValues();
	//console.log(scene.centerObject);

	for (var i = 1; i < size - 1; i++)
	{
		for (var j = 1; j < size - 1; j++)
		{//glContext, name, parent = null, ambient, diffuse, specular, n, alpha, texture, textureNorm
			//glContext, name, parent, ambient, diffuse, specular, n, alpha, position, scale, vertShader, fragShader
			let position = vec3.fromValues(i, j, size-1);
			let	temp = createCube(glContext, "FaceFront"+ (count.toString()), scene.centerObject, ambient, diffuse, specular, n, alpha, position, scale, vertShader, fragShader);
			scene.objects.forward.push(temp);

			position = vec3.fromValues(i, j, 0);
			temp = createCube(glContext, "FaceBack"+ (count.toString()), scene.centerObject, ambient, diffuse, specular, n, alpha, position, scale, vertShader, fragShader);
			scene.objects.backward.push(temp);

			position = vec3.fromValues(i, size-1, j);
			temp = createCube(glContext, "FaceUp"+ (count.toString()), scene.centerObject, ambient, diffuse, specular, n, alpha, position, scale, vertShader, fragShader);
			scene.objects.up.push(temp);

			position = vec3.fromValues(i, 0, j);
			temp = createCube(glContext, "FaceDown"+ (count.toString()), scene.centerObject, ambient, diffuse, specular, n, alpha, position, scale, vertShader, fragShader);
			scene.objects.down.push(temp);

			position = vec3.fromValues(0, i, j);
			temp = createCube(glContext, "FaceLeft"+ (count.toString()), scene.centerObject, ambient, diffuse, specular, n, alpha, position, scale, vertShader, fragShader);
			scene.objects.left.push(temp);

			position = vec3.fromValues(size-1, i, j);
			temp = createCube(glContext, "FaceRight"+ (count.toString()), scene.centerObject, ambient, diffuse, specular, n, alpha, position, scale, vertShader, fragShader);
			scene.objects.right.push(temp);

			count++;
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
	console.log(scene.objects);
	return scene;
}

//whatever
function createCube(glContext, name, parent, ambient, diffuse, specular, n, alpha, position, scale, vertShader, fragShader)
{
	let cube = new Cube(glContext, name, parent, ambient, diffuse, specular, n, alpha);
	cube.vertShader = vertShader;
	cube.fragShader = fragShader;
	cube.scale(scale);
	cube.model.position = position;
	cube.setup();


	return cube
}