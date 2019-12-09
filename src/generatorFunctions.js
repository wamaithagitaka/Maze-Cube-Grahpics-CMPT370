var size = 5;

const animation = {
	ROTATING: "rotating",
	DROPPING: "dropping",
}

function generateScene(glContext, vertShader, fragShader) {
	let scene = {
		objects: [],
		centerObject: {},
		fakeCenter: {},
	}

	let count = 0;
	let scale = vec3.fromValues(2.0, 2.0, 2.0);
	// ambient, diffuse, specular, n, alpha 
	let ambient = vec3.fromValues(0.5,0.5,0.5);
	let diffuse = vec3.fromValues(0.5,0.5,0.5);
	let specular = vec3.fromValues(1.0,1.0,1.0);
	let n = 1000.0;
    let alpha = 0.05;
    let name = "";

	let fakeCenterPos =  vec3.fromValues(1 + 0.1  - (size / 2), 1 + 0.1 - (size / 2), 1 + 0.1 - (size / 2));
	let centerPos =  vec3.fromValues(0, 0, 0);
	let centerScale = vec3.fromValues(1.0, 1.0, 1.0);
	let fakeCenterScale = vec3.fromValues(size * 2 - 4 - 0.4, size * 2 - 4 - 0.4, size * 2 - 4 - 0.4);
	let centerColor = vec3.fromValues(0.8, 0.2, 0.1);
	scene.centerObject = createCube(glContext, "Center", null, centerColor, diffuse, specular, n, 1.0, centerPos, centerScale, vertShader, fragShader);
    scene.centerObject.centroid = vec3.fromValues(0,0,0);
    scene.fakeCenter = createCube(glContext, "FakeCenter", scene.centerObject, centerColor, diffuse, specular, n, 1.0, fakeCenterPos, fakeCenterScale, vertShader, fragShader);
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
					let position = vec3.fromValues(i - (size / 2), j - (size / 2), k - (size / 2));
					let	temp = createCube(glContext, name + (count.toString()), scene.centerObject, ambient, diffuse, specular, n, alpha, position, scale, vertShader, fragShader);
					
					scene.objects.push(temp);
				} 
				else
				{
					if (j === 0 || j === size - 1)
                    {	//left and right faces
                        if (j === 0) {name = "RightFace";}
                        if (j === size - 1) {name = "LeftFace";}
						let position = vec3.fromValues(i - (size / 2), j - (size / 2), k - (size / 2));
						let	temp = createCube(glContext, name + (count.toString()), scene.centerObject, ambient, diffuse, specular, n, alpha, position, scale, vertShader, fragShader);
						
						scene.objects.push(temp);
					}
					else if (i === 0 || i === size - 1)
                    {	//top and bottom faces
                        if (i === 0) {name = "BottomFace";}
                        if (i === size - 1) {name = "TopFace";}
						let position = vec3.fromValues(i - (size / 2), j - (size / 2), k - (size / 2));
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

//k = z, i = x, j = y; 0,0,0 is at the very top left closest to the camera (with current configuration)
function cubeIndex(i, j, k)
{
	if (i < size && i >= 0 && j < size && j >= 0 && k < size && k >= 0)
		{return (i + (j * size + (k * size * size)))}
	/*else
        {console.log ("Index is larger than size")}*/
    //return (i + (j * size + (k * size * size)))
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

function getAdjustedCubePosition(state, cubeIndex)
{
	if (state.cubes[cubeIndex] === null) {
		console.log ("Tried to grab null cube index");
	}
	else {
		let position = vec3.fromValues(0.5, 0.5, 0.5);

		//1 is due to half of the cube scale
		vec3.add(position, position, state.cubes[cubeIndex].model.position);
	}
}

//Ideally there's a procedural generator here, but who has time for that
function hardcodeMyMazeThanks(state)
{
	//face A @ size 5
	turnCubeToWall(state, 0, 0, 0);
	turnCubeToWall(state, 0, 1, 0);
	turnCubeToWall(state, 1, 1, 0);
	turnCubeToWall(state, 2, 1, 0);
	turnCubeToWall(state, 3, 0, 0);
	turnCubeToWall(state, 4, 0, 0);
	turnCubeToWall(state, 3, 2, 0);
	turnCubeToWall(state, 1, 3, 0);
	turnCubeToWall(state, 0, 4, 0);
	turnCubeToWall(state, 2, 4, 0);
	turnCubeToWall(state, 4, 4, 0);
	turnCubeToWall(state, 4, 1, 0);
	//face B @ size 5
	turnCubeToWall(state, 0, 0, 1);
	turnCubeToWall(state, 0, 0, 2);
	turnCubeToWall(state, 0, 0, 4);
	turnCubeToWall(state, 0, 1, 2);
	turnCubeToWall(state, 0, 2, 2);
	turnCubeToWall(state, 0, 2, 4);
	turnCubeToWall(state, 0, 3, 1);
	turnCubeToWall(state, 0, 4, 3);
	turnCubeToWall(state, 0, 4, 4);

	//face C @ size 5
	turnCubeToWall(state,1,0,4);
	turnCubeToWall(state,4,0,4);
	turnCubeToWall(state,2,1,4);
	turnCubeToWall(state,3,1,4);
	turnCubeToWall(state,1,2,4);
	turnCubeToWall(state,3,2,4);
	turnCubeToWall(state,1,3,4);
	turnCubeToWall(state,3,3,4);
	turnCubeToWall(state,1,4,4);
	turnCubeToWall(state,4,4,4);
	turnCubeToEnd(state,2,2,4);

	//face D @ size 5
	turnCubeToWall(state,4,1,1);
	turnCubeToWall(state,4,1,2);
	turnCubeToWall(state,4,2,3);
	turnCubeToWall(state,4,3,1);
	turnCubeToWall(state,4,4,2);
	turnCubeToWall(state,4,4,3);

	//face E @ size 5
	turnCubeToWall(state,3,4,1);
	turnCubeToWall(state,1,4,2);
	turnCubeToWall(state,3,4,2);

	//Face F @ size 5
	turnCubeToWall(state,2,0,2);
	turnCubeToWall(state,3,0,2);
	turnCubeToWall(state,3,0,3);
}

function turnCubeToWall(state,x,y,z)
{
	state.cubes[cubeIndex(x, y, z)].material.alpha = 0.8;
	state.cubes[cubeIndex(x, y, z)].material.ambient = vec3.fromValues(0.3,0.3,0.3);
}

function turnCubeToEnd(state,x,y,z)
{
	state.cubes[cubeIndex(x, y, z)].material.alpha = 0.75;
	state.cubes[cubeIndex(x, y, z)].material.ambient = vec3.fromValues(0.55,0.55,0);
}