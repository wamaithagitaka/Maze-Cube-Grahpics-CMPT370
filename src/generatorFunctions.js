var size = 5;

const direction = {
	FORWARD: vec3.fromValues(0, 0, 1),
	BACKWARD: vec3.fromValues(0, 0, -1),
	UP: vec3.fromValues(0, 1, 0),
	DOWN: vec3.fromValues(0, -1, 0),
	LEFT: vec3.fromValues(-1, 0, 0),
	RIGHT: vec3.fromValues(1, 0, 0),
}
function generateScene2(glContext, vertShader, fragShader) {
	var scene = {
		objects: [],
		centerObject: {},
		fakeCenter: {},
	}

	var count = 0;
	let scale = vec3.fromValues(2.0, 2.0, 2.0);
	// ambient, diffuse, specular, n, alpha 
	let ambient = vec3.fromValues(0.5,0.5,0.5);
	let diffuse = vec3.fromValues(0.5,0.5,0.5);
	let specular = vec3.fromValues(1.0,1.0,1.0);
	let n = 5.0;
	let alpha = 0.05;

	let fakeCenterPos =  vec3.fromValues(1 + 0.1, 1 + 0.1, 1 + 0.1);
	let centerPos =  vec3.fromValues(0, 0, 0);
	let centerScale = vec3.fromValues(1.0, 1.0, 1.0);
	let fakeCenterScale = vec3.fromValues(size * 2 - 4 - 0.4, size * 2 - 4 - 0.4, size * 2 - 4 - 0.4);
	let centerColor = vec3.fromValues(0.8, 0.2, 0.1);
	scene.centerObject = createCube(glContext, "Center", null, centerColor, diffuse, specular, n, 1.0, centerPos, centerScale, vertShader, fragShader);
	scene.fakeCenter = createCube(glContext, "FakeCenter", scene.centerObject, centerColor, diffuse, specular, n, 1.0, fakeCenterPos, fakeCenterScale, vertShader, fragShader);
    let name = "";
    for (var k = 0; k < size; k++)
	{
		for (var j = 0; j < size; j++)
		{
			for (var i = 0; i < size; i++)
			{
				if (k === 0 || k === (size - 1))
                {	//front and back faces
                    if (k === 0) {name = "FrontFace";}
                    if (k === size - 1) {name = "BackFace";}
					let position = vec3.fromValues(i, j, k);
					let	temp = createCube(glContext, name + (count.toString()), scene.centerObject, ambient, diffuse, specular, n, alpha, position, scale, vertShader, fragShader);
					
					scene.objects.push(temp);
				} 
				else
				{
					if (j === 0 || j === size - 1)
                    {	//left and right faces
                        if (j === 0) {name = "RightFace";}
                        if (j === size - 1) {name = "LeftFace";}
						let position = vec3.fromValues(i, j, k);
						let	temp = createCube(glContext, name + (count.toString()), scene.centerObject, ambient, diffuse, specular, n, alpha, position, scale, vertShader, fragShader);
						
						scene.objects.push(temp);
					}
					else if (i === 0 || i === size - 1)
                    {	//top and bottom faces
                        if (i === 0) {name = "BottomFace";}
                        if (i === size - 1) {name = "TopFace";}
						let position = vec3.fromValues(i, j, k);
						let	temp = createCube(glContext, name + (count.toString()), scene.centerObject, ambient, diffuse, specular, n, alpha, position, scale, vertShader, fragShader);
						
						scene.objects.push(temp);
					}
					else{
						scene.objects.push(null);
					}
				}
				count++;
			}
		}
	}

	return scene;
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
	let alpha = 0.05;

	let fakeCenterPos =  vec3.fromValues(1 + 0.1, 1 + 0.1, 1 + 0.1);
	let centerPos =  vec3.fromValues(0, 0, 0);
	let centerScale = vec3.fromValues(1.0, 1.0, 1.0);
	let fakeCenterScale = vec3.fromValues(size * 2 - 4 - 0.4, size * 2 - 4 - 0.4, size * 2 - 4 - 0.4);
	let centerColor = vec3.fromValues(0.8, 0.2, 0.1);
	scene.centerObject = createCube(glContext, "Center", null, centerColor, diffuse, specular, n, 1.0, centerPos, centerScale, vertShader, fragShader);
	scene.objects.modelCenter.push(createCube(glContext, "FakeCenter", scene.centerObject, centerColor, diffuse, specular, n, 1.0, fakeCenterPos, fakeCenterScale, vertShader, fragShader));
	//scene.centerObject.centroid = vec3.fromValues();
	//console.log(scene.centerObject);

	for (var i = 1; i < size - 1; i++)
	{
		for (var j = 1; j < size - 1; j++)
		{//glContext, name, parent = null, ambient, diffuse, specular, n, alpha, texture, textureNorm
			//glContext, name, parent, ambient, diffuse, specular, n, alpha, position, scale, vertShader, fragShader
			let position = vec3.fromValues(i, j, size-1);
			let	temp = createCube(glContext, "FaceFront"+ (count.toString()), scene.centerObject, ambient, diffuse, specular, n, alpha + count/10, position, scale, vertShader, fragShader);
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

			position = vec3.fromValues(size-1, j, i);
			temp = createCube(glContext, "FaceRight"+ (count.toString()), scene.centerObject, ambient, diffuse, specular, 0, alpha + count/10, position, scale, vertShader, fragShader);
			scene.objects.right.push(temp);

			count++;
		}
	}
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

	cube.centroid = vec3.fromValues(size/2, size/2, size/2);
	return cube
}

function cubeIndex(i, j, k)
{
	if (i < size && i >= 0 && j < size && j >= 0 && k < size && k >= 0)
		{return (i + (j * size + (k * size * size)))}
	else
		{console.log ("Index is larger than size")}
}

function setToCubePosition(state, object, cubeIndex)
{
	if (state.cubes[cubeIndex] === null) {
		console.log ("Tried to grab null cube index");
	}
	else {
		let playerInitialPosition = state.cubes[cubeIndex].model.position;

		//1 is due to half of the cube scale
		object.model.position = vec3.fromValues(playerInitialPosition[0] + 0.5, playerInitialPosition[1] + 0.5, playerInitialPosition[2] + 0.5);
	}
}