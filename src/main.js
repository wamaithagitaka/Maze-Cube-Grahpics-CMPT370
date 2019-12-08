var total = 0;
var state = {};
var stats = new Stats();
var size = 5;

window.onload = () => {
    parseSceneFile("./statefiles/alienScene.json", state, main);
}

/**
 * 
 * @param {object - contains vertex, normal, uv information for the mesh to be made} mesh 
 * @param {object - the game object that will use the mesh information} object 
 * @purpose - Helper function called as a callback function when the mesh is done loading for the object
 */
function createMesh(mesh, object) {
    if (object.type === "mesh") {
        let testModel = new Model(state.gl, object.name, mesh, object.parent, object.material.ambient, object.material.diffuse, object.material.specular, object.material.n, object.material.alpha, object.texture);
        testModel.vertShader = state.vertShaderSample;
        testModel.fragShader = state.fragShaderSample;
        testModel.setup();
        testModel.model.position = object.position;
        if (object.scale) {
            testModel.scale(object.scale);
        }
        addObjectToScene(state, testModel);
    } else if (object.type === "player") {
        let testModel = new Model(state.gl, object.name, mesh, object.parent, object.material.ambient, object.material.diffuse, object.material.specular, object.material.n, object.material.alpha, object.texture);
        testModel.vertShader = state.vertShaderSample;
        testModel.fragShader = state.fragShaderSample;
        testModel.setup();
        testModel.model.position = object.position;
        if (object.scale) {
            testModel.scale(object.scale);
        }
        addObjectToScene(state, testModel);
        //due to timing issues we're slapping everything here
        //testModel.centroid = vec3.add(testModel.centroid, testModel.centroid, vec3.fromValues(0.5, 0.5, 0.5))
        state.playerObject = testModel; 
        setToCubePosition(state, state.playerObject, cubeIndex(Math.floor(size/2), Math.floor(size/2), 0));
        state.currentPlayerPosition = state.cubes[cubeIndex(Math.floor(size/2), Math.floor(size/2), 0)].model.position;
        console.log(state);
    } else {
        let testLight = new Light(state.gl, object.name, mesh, object.parent, object.material.ambient, object.material.diffuse, object.material.specular, object.material.n, object.material.alpha, object.colour, object.strength);
        testLight.vertShader = state.vertShaderSample;
        testLight.fragShader = state.fragShaderSample;
        testLight.setup();
        testLight.model.position = object.position;
        if (object.scale) {
            testLight.scale(object.scale);
        }

        addObjectToScene(state, testLight);
        testLight.centroid = vec3.fromValues(0,0,0);
        state.lights.push(testLight);
    }
}

/*
 * @param {string - type of object to be added to the scene} type 
 * @param {string - url of the model being added to the game} url 
 * @purpose **WIP** Adds a new object to the scene from using the gui to add said object 
 */
function addObject(type, url = null) {
    if (type === "Cube") {
        let testCube = new Cube(state.gl, "Cube", null, [0.1, 0.1, 0.1], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], 10, 1.0);
        testCube.vertShader = state.vertShaderSample;
        testCube.fragShader = state.fragShaderSample;
        testCube.setup();

        addObjectToScene(state, testCube);
        createSceneGui(state);
    }
}

function main() {
    stats.showPanel(0);
    document.getElementById("fps").appendChild(stats.dom);
    //document.body.appendChild( stats.dom );
    const canvas = document.querySelector("#glCanvas");

    // Initialize the WebGL2 context
    var gl = canvas.getContext("webgl2");

    // Only continue if WebGL2 is available and working
    if (gl === null) {
        printError('WebGL 2 not supported by your browser',
            'Check to see you are using a <a href="https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API#WebGL_2_2" class="alert-link">modern browser</a>.');
        return;
    }

    const vertShaderSample =
        `#version 300 es
        in vec3 aPosition;
        in vec3 aNormal;
        in vec2 aUV;
        in vec3 aVertBitang;
        uniform mat4 uProjectionMatrix;
        uniform mat4 uViewMatrix;
        uniform mat4 uModelMatrix;
        uniform mat4 normalMatrix;
        
        out vec3 oFragPosition;
        out vec3 oCameraPosition;
        out vec3 oNormal;
        out vec3 normalInterp;
        out vec2 oUV;
        out vec3 oVertBitang;
        void main() {
            // Postion of the fragment in world space
            //gl_Position = vec4(aPosition, 1.0);
            gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * vec4(aPosition, 1.0);
            oFragPosition = (uModelMatrix * vec4(aPosition, 1.0)).xyz;
            oNormal = normalize((uModelMatrix * vec4(aNormal, 1.0)).xyz);
            normalInterp = vec3(normalMatrix * vec4(aNormal, 0.0));
            oUV = aUV;
            oVertBitang = aVertBitang;
        }
        `;

    const fragShaderSample =
        `#version 300 es
        #define MAX_LIGHTS 128
        precision highp float;
        in vec3 oFragPosition;
        in vec3 oNormal;
        in vec3 normalInterp;
        in vec2 oUV;
        in vec3 oVertBitang;
        
        uniform vec3 uCameraPosition;
        uniform int numLights;
        uniform vec3 diffuseVal;
        uniform vec3 ambientVal;
        uniform vec3 specularVal;
        uniform float nVal;
        uniform float alphaVal;
        uniform sampler2D uTexture;
        uniform int samplerExists;
        uniform int uTextureNormExists;
        uniform sampler2D uTextureNorm;
        uniform vec3 uLightPositions[MAX_LIGHTS];
        uniform vec3 uLightColours[MAX_LIGHTS];
        uniform float uLightStrengths[MAX_LIGHTS];
     
        out vec4 fragColor;
        void main() {
            vec3 normal = normalize(normalInterp);
            vec3 ambient = vec3(0,0,0);
            vec3 diffuse = vec3(0,0,0);
            vec3 specular = vec3(0,0,0);
            vec3 lightDirection;
            float lightDistance;
            if (uTextureNormExists == 1) {
                normal = texture(uTextureNorm, oUV).xyz;
                normal = 2.0 * normal - 1.0;
                normal = normal * vec3(5.0, 5.0, 5.0);
                vec3 biTangent = cross(oNormal, oVertBitang);
                mat3 nMatrix = mat3(oVertBitang, biTangent, oNormal);
                normal = normalize(nMatrix * normal);
            }
            for (int i = 0; i < numLights; i++) {
                lightDirection = normalize(uLightPositions[i] - oFragPosition);
                lightDistance = distance(uLightPositions[i], oFragPosition);
                //ambient
                ambient += (ambientVal * uLightColours[i]) * uLightStrengths[i];
                //diffuse
                float NdotL = max(dot(lightDirection, normal), 0.0);
                /*
                vec3 mixedColor = vec3(0,0,0);
                if (samplerExists == 1){
                    vec4 textureColor = texture(uTexture, oUV);
                    mixedColor = mix(diffuseVal, (textureColor.rgb), 0.50);
                } else {
                    mixedColor = diffuseVal;
                }
                */
                diffuse += ((diffuseVal * uLightColours[i]) * NdotL * uLightStrengths[i]) / lightDistance;
                //specular
                vec3 nCameraPosition = normalize(uCameraPosition); // Normalize the camera position
                vec3 V = normalize(nCameraPosition - oFragPosition);
                vec3 H = normalize(V + lightDirection); // H = V + L normalized
                if (NdotL > 0.0f)
                {
                    float NDotH = max(dot(normal, H), 0.0);
                    float NHPow = pow(NDotH, nVal); // (N dot H)^n
                    specular += ((specularVal * uLightColours[i]) * NHPow) / lightDistance;
                }
            }
            vec4 textureColor = texture(uTexture, oUV);
            if (samplerExists == 1) {
                fragColor = vec4((ambient + diffuse + specular) * textureColor.rgb, alphaVal);
            } else {
                fragColor = vec4(ambient + diffuse + specular, alphaVal);
            }
            
        }
        `;

    state = {
        ...state,
        gl,
        vertShaderSample,
        fragShaderSample,
        canvas: canvas,
        objectCount: 0,
        objectTable: {},
        lightIndices: [],
        keyboard: {},
        mouse: { sensitivity: 0.2 },
        gameStarted: false,
        camera: {
            name: 'camera',
            position: vec3.fromValues(0, 0, -6 - size/2),
            center: vec3.fromValues(0, 0, 0),
            up: vec3.fromValues(0.0, 1.0, 0.0),
            pitch: 0,
            yaw: 0,
            roll: 0
        },
        samplerExists: 0,
        samplerNormExists: 0,
        centerObject: null,
        playerObject: null,
        cubes: null,
        animationState: null, //animation.DROPPING,
        currentPlayerPosition: null,
        gravity: {
            position: vec3.fromValues(0.0, 0.0, -1.0),
            center: vec3.fromValues(0.0, 0.0, 0.0),
            up: vec3.fromValues(0.0, -1.0, 0.0),
        },
        gravityMatrix: null,
        lights: [],
        nextPlayerPosition: null,
        nextRotationPosition: null,
        freeCamera: {
            name: 'camera',
            position: vec3.fromValues(0, 0, -6 - size/2),
            center: vec3.fromValues(0, 0, 0),
            up: vec3.fromValues(0.0, 1.0, 0.0),
            use: false,
        },
    };

    state.numLights = state.lights.length;

    //UGHHHH
    //generate scene
    let world = generateScene(gl, vertShaderSample, fragShaderSample);
    console.log(world);
    world.objects.forEach((element) => 
    {
        if (element != null){
            addObjectToScene(state, element);
        }
    })
    addObjectToScene(state, world.centerObject);
    addObjectToScene(state, world.fakeCenter);
    state.centerObject = world.centerObject;
    state.cubes = world.objects;
    //setup gravity matrix
    state.gravityMatrix = mat4.create();
    mat4.invert(state.gravityMatrix, state.gravityMatrix); //rotateRoundZ(state.gravityMatrix, Math.PI);
    /*mat4.lookAt(
        state.gravityMatrix,
        state.gravity.position,
        state.gravity.center,
        state.gravity.up,
    );*/
    console.log(returnMat4Legibly(state.gravityMatrix));
    //console.log(state.objects);

    //iterate through the level's objects and add them
    state.level.objects.map((object) => {
        if (object.type === "mesh" || object.type === "light" || object.type === "player") {
            parseOBJFileToJSON(object.model, createMesh, object);
        } 
        else if (object.type === "cube") {
            let tempCube = new Cube(gl, object.name, object.parent, object.material.ambient, object.material.diffuse, object.material.specular, object.material.n, object.material.alpha, object.texture, object.textureNorm);
            tempCube.vertShader = vertShaderSample;
            tempCube.fragShader = fragShaderSample;
            tempCube.setup();
            tempCube.model.position = vec3.fromValues(object.position[0], object.position[1], object.position[2]);
            if (object.scale) {
                tempCube.scale(object.scale);
            }
            addObjectToScene(state, tempCube);
        } else if (object.type === "plane") {
            let tempPlane = new Plane(gl, object.name, object.parent, object.material.ambient, object.material.diffuse, object.material.specular, object.material.n, object.material.alpha, object.texture, object.textureNorm);
            tempPlane.vertShader = vertShaderSample;
            tempPlane.fragShader = fragShaderSample;
            tempPlane.setup();

            tempPlane.model.position = vec3.fromValues(object.position[0], object.position[1], object.position[2]);
            if (object.scale) {
                tempPlane.scale(object.scale);
            }
            addObjectToScene(state, tempPlane);
        }
    })


    //setup mouse click listener
    /*
    canvas.addEventListener('click', (event) => {
        getMousePick(event, state);
    }) */
    startRendering(gl, state);
}

/**
 * 
 * @param {object - object containing scene values} state 
 * @param {object - the object to be added to the scene} object 
 * @purpose - Helper function for adding a new object to the scene and refreshing the GUI
 */
function addObjectToScene(state, object) {
    //console.log(object);
    if (object.type === "light") {
        state.lightIndices.push({
            model: {
                position: object.model.position,
            },
            colour: object.colour,
            strength: object.strength,
        });
        state.numLights++;
        //console.log(state.lightIndices);
    }

    object.name = object.name;
    state.objects.push(object);
    state.objectTable[object.name] = state.objectCount;
    state.objectCount++;
    createSceneGui(state);
}

/**
 * 
 * @param {gl context} gl 
 * @param {object - object containing scene values} state 
 * @purpose - Calls the drawscene per frame
 */
function startRendering(gl, state) {
    // A variable for keeping track of time between frames
    var then = 0.0;

    // This function is called when we want to render a frame to the canvas
    function render(now) {
        stats.begin();
        now *= 0.001; // convert to seconds
        const deltaTime = now - then;
        then = now;

        state.deltaTime = deltaTime;

        //wait until the scene is completely loaded to render it
        if (state.numberOfObjectsToLoad <= state.objects.length) {
            if (!state.gameStarted) {
                startGame(state);
                state.gameStarted = true;
            }

            if (state.keyboard["w"]) {
                //moveForward(state);
            }
            if (state.keyboard["s"]) {
                //moveBackward(state);
            }
            if (state.keyboard["a"]) {
                //moveLeft(state);
            }
            if (state.keyboard["d"]) {
                //moveRight(state);
                //vec3.rotateY(state.camera.position, state.camera.position, vec3.fromValues(0,0,0), 90 * (Math.PI/180));
            }

            if (state.mouse['camMove']) {
                //vec3.rotateY(state.camera.center, state.camera.center, state.camera.position, (state.camera.yaw - 0.25) * deltaTime * state.mouse.sensitivity);
                //vec3.rotateY(state.camera.center, state.camera.center, state.camera.position, (-state.mouse.rateX * deltaTime * state.mouse.sensitivity));
                vec3.rotateY(state.freeCamera.position, state.freeCamera.position, vec3.fromValues(0,0,0), (-state.mouse.rateX * deltaTime * state.mouse.sensitivity));
                state.freeCamera.use = true;
                //sortedObjects = null; //sorting is activated but doesn't do anything
            }
            else {
                state.freeCamera.use = false;
                //console.log("here");
                state.freeCamera.position = state.camera.position.slice();
            }

            tmp = returnMat4Logically(state.gravityMatrix);
                state.camera.up = vec3.fromValues(-tmp.y[0], -tmp.y[1], -tmp.y[2]);
                state.camera.position = vec3.fromValues(tmp.z[0], tmp.z[1], tmp.z[2]);
                vec3.scale(state.camera.position, state.camera.position, -9);

            //UGHHHH
            if (state.playerObject != null)
            {
                mat4.rotateY(state.playerObject.model.rotation, state.playerObject.model.rotation, 3 * deltaTime);
                mat4.rotateX(state.playerObject.model.rotation, state.playerObject.model.rotation, 3 * deltaTime);
                //move only if we're not locked in "animation"
                if (state.animationState === null)
                {
                    let grav = returnMat4Logically(state.gravityMatrix);
                    let nextCubeIndex = cubeIndex(parseInt(state.currentPlayerPosition[0] + size/2 + grav.y[0]), parseInt(state.currentPlayerPosition[1] + size/2 + grav.y[1]), parseInt(state.currentPlayerPosition[2] + size/2 + grav.y[2]));
                    let nextCube = state.cubes[nextCubeIndex]
                    
                    //console.log(nextCubeIndex);
                    
                    if (nextCube != null && nextCubeIndex != undefined)
                    {
                        //console.log(state.currentPlayerPosition);

                        //vec3.negate(state.camera.up, returnMat4Logically(state.gravityMatrix).y)
                        //setToCubePosition(state, state.playerObject, nextCubeIndex);
                        state.currentPlayerPosition = nextCube.model.position;
                        //console.log(state.currentPlayerPosition);
                        state.nextPlayerPosition = nextCube.model.position;
                        //state.animationState = animation.DROPPING;

                    }
                }
                /*else {
                    //vec3.fromValues(playerInitialPosition[0] + 0.5, playerInitialPosition[1] + 0.5, playerInitialPosition[2] + 0.5);
                    let temp = vec3.create();
                    vec3.sub(temp, state.nextPlayerPosition, state.currentPlayerPosition);
                    // let distance = vec3.create();
                    // vec3.sub(distance, state.nextPlayerPosition, state.playerObject.model.position);
                    // let acceptedRange = vec3.create();
                    // vec3.scale(acceptedRange, temp, 0.1);
                    let offset = vec3.fromValues(0.5, 0.5, 0.5);
                    let offsetPlayerPosition = vec3.create();
                    vec3.add(offsetPlayerPosition, state.playerObject.model.position, offset);

                    console.log(state.nextPlayerPosition);
                    console.log(offsetPlayerPosition)
                    console.log(vec3.distance(offsetPlayerPosition, state.nextPlayerPosition));
                    //vec3.scale(temp, temp, 10);
                    if (vec3.distance(state.playerObject.model.position, state.nextPlayerPosition) >= 0.1)
                    {
                        vec3.add(state.playerObject.model.position, state.playerObject.model.position, temp * deltaTime);
                    }
                    else{
                        state.animation = false;
                    }
                }*/
            }
            if (state.lights[0] != undefined && state.lights[1] != undefined){
                mat4.rotateY(state.lights[0].model.rotation, state.lights[0].model.rotation, 10 * deltaTime);
                mat4.rotateX(state.lights[1].model.rotation, state.lights[1].model.rotation, 10 * deltaTime);
            }
            // Draw our scene
            drawScene(gl, deltaTime, state);
        }
        stats.end();
        // Request another frame when this one is done
        requestAnimationFrame(render);
    }

    // Draw the scene
    requestAnimationFrame(render);
}
//var dbug = 0;
/**
 * 
 * @param {gl context} gl 
 * @param {float - time from now-last} deltaTime 
 * @param {object - contains the state for the scene} state 
 * @purpose Iterate through game objects and render the objects aswell as update uniforms
 */
var sortedObjects = null; //limit calls because constantly sorting is unnecessary
function drawScene(gl, deltaTime, state) {
    if (sortedObjects === null) {
        sortedObjects = state.objects.sort((a, b) => {
            var h = vec3.distance(state.camera.position, a.model.position);
            var k = vec3.distance(state.camera.position, b.model.position);
            
            return k - h;
        }); 
    }
    // if (state.freeCamera.use){
    //     sortedObjects = state.objects.sort((a, b) => {
    //         var h = vec3.distance(state.camera.position, a.model.position);
    //         var k = vec3.distance(state.camera.position, b.model.position);
            
    //         return k - h;
    //     }); 
    // }
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST); // Enable depth testing
    //gl.enable(gl.CULL_FACE);
    gl.depthFunc(gl.LEQUAL); // Near things obscure far things
    gl.clearDepth(1.0); // Clear everything
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    let lightPositionArray = [], lightColourArray = [], lightStrengthArray = [];

    gl.depthMask(false);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE_MINUS_CONSTANT_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    
    
    for (let i = 0; i < state.lightIndices.length; i++) {
        // let light = state.objects[state.lightIndices[i]];
        let light = state.lightIndices[i];
        if (light != null){
            for (let j = 0; j < 3; j++) {
                lightPositionArray.push(light.model.position[j]);
                lightColourArray.push(light.colour[j]);
            }
            lightStrengthArray.push(light.strength);
        }
    }

    sortedObjects.map((object) => {
        if (object.loaded) {
            // if (object.type === "light") {
            //     let light = object;
            //     console.log(light);
            //     for (let j = 0; j < 3; j++) {
            //         lightPositionArray.push(light.model.position[j]);
            //         lightColourArray.push(light.colour[j]);
            //     }
            //     lightStrengthArray.push(light.strength);
            // }
            gl.useProgram(object.programInfo.program);
            {
                //console.log(object.alpha);
                if (object.material.alpha < 1.0) {
                    // TODO turn off depth masking DONE
                    // enable blending and specify blending function 
                    // clear depth for correct transparency rendering 
                    gl.depthMask(false);
                    gl.enable(gl.BLEND);
                    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
                }
                else {
                    // TODO disable blending 
                    // enable depth masking and z-buffering
                    // specify depth function
                    // clear depth with 1.0
                    gl.disable(gl.BLEND);
                    gl.depthMask(true);
                    gl.enable(gl.DEPTH_TEST);
                    gl.depthFunc(gl.LEQUAL);
                }

                var projectionMatrix = mat4.create();
                var fovy = 60.0 * Math.PI / 180.0; // Vertical field of view in radians
                var aspect = state.canvas.clientWidth / state.canvas.clientHeight; // Aspect ratio of the canvas
                var near = 0.1; // Near clipping plane
                var far = 100.0; // Far clipping plane

                mat4.perspective(projectionMatrix, fovy, aspect, near, far);

                gl.uniformMatrix4fv(object.programInfo.uniformLocations.projection, false, projectionMatrix);

                state.projectionMatrix = projectionMatrix;

                var viewMatrix = mat4.create();
                if (state.freeCamera.use){
                    mat4.lookAt(
                        viewMatrix,
                        state.freeCamera.position,
                        state.freeCamera.center,
                        state.freeCamera.up,
                    );
                }
                else {
                    mat4.lookAt(
                        viewMatrix,
                        state.camera.position,
                        state.camera.center,
                        state.camera.up,
                    );
                }

                gl.uniformMatrix4fv(object.programInfo.uniformLocations.view, false, viewMatrix);

                gl.uniform3fv(object.programInfo.uniformLocations.cameraPosition, state.camera.position);

                state.viewMatrix = viewMatrix;

                var modelMatrix = mat4.create();
                var negCentroid = vec3.fromValues(0.0, 0.0, 0.0);
                vec3.negate(negCentroid, object.centroid);

                mat4.translate(modelMatrix, modelMatrix, object.model.position);
                mat4.translate(modelMatrix, modelMatrix, object.centroid);
                mat4.mul(modelMatrix, modelMatrix, object.model.rotation);
                mat4.translate(modelMatrix, modelMatrix, negCentroid);
                mat4.scale(modelMatrix, modelMatrix, object.model.scale);

                object.model.modelMatrix = modelMatrix;

                if (object.parent != null) {
                    mat4.multiply(modelMatrix, object.parent.model.modelMatrix, modelMatrix);
                }

                //object.modelMatrix = modelMatrix;

                var normalMatrix = mat4.create();
                mat4.invert(normalMatrix, modelMatrix);
                mat4.transpose(normalMatrix, normalMatrix);

                gl.uniformMatrix4fv(object.programInfo.uniformLocations.model, false, modelMatrix);
                gl.uniformMatrix4fv(object.programInfo.uniformLocations.normalMatrix, false, normalMatrix);

                gl.uniform3fv(object.programInfo.uniformLocations.diffuseVal, object.material.diffuse);
                gl.uniform3fv(object.programInfo.uniformLocations.ambientVal, object.material.ambient);
                gl.uniform3fv(object.programInfo.uniformLocations.specularVal, object.material.specular);
                gl.uniform1f(object.programInfo.uniformLocations.nVal, object.material.n);
                gl.uniform1f(object.programInfo.uniformLocations.alphaVal, object.material.alpha);

                gl.uniform1i(object.programInfo.uniformLocations.numLights, state.numLights);



                //use this check to wait until the light meshes are loaded properly
                if (lightColourArray.length > 0 && lightPositionArray.length > 0 && lightStrengthArray.length > 0) {
                    gl.uniform3fv(object.programInfo.uniformLocations.lightPositions, lightPositionArray);
                    gl.uniform3fv(object.programInfo.uniformLocations.lightColours, lightColourArray);
                    gl.uniform1fv(object.programInfo.uniformLocations.lightStrengths, lightStrengthArray);
                }

                
                // Bind the buffer we want to draw
                gl.bindVertexArray(object.buffers.vao);

                //check for diffuse texture and apply it
                if (object.model.texture != null) {
                    state.samplerExists = 1;
                    gl.activeTexture(gl.TEXTURE0);
                    gl.uniform1i(object.programInfo.uniformLocations.samplerExists, state.samplerExists);
                    gl.uniform1i(object.programInfo.uniformLocations.sampler, 0);
                    gl.bindTexture(gl.TEXTURE_2D, object.model.texture);
                    
                } else {
                    gl.activeTexture(gl.TEXTURE0);
                    state.samplerExists = 0;
                    gl.uniform1i(object.programInfo.uniformLocations.samplerExists, state.samplerExists);
                    gl.bindTexture(gl.TEXTURE_2D, null);
                }

                //check for normal texture and apply it
                if (object.model.textureNorm != null) {
                    state.samplerNormExists = 1;
                    gl.activeTexture(gl.TEXTURE1);
                    gl.uniform1i(object.programInfo.uniformLocations.normalSamplerExists, state.samplerNormExists);
                    gl.uniform1i(object.programInfo.uniformLocations.normalSampler, 1);
                    gl.bindTexture(gl.TEXTURE_2D, object.model.textureNorm);
                    //console.log("here")
                } else {
                    gl.activeTexture(gl.TEXTURE1);
                    state.samplerNormExists = 0;
                    gl.uniform1i(object.programInfo.uniformLocations.normalSamplerExists, state.samplerNormExists);
                    gl.bindTexture(gl.TEXTURE_2D, null);
                }

                // Draw the object
                const offset = 0; // Number of elements to skip before starting

                //if its a mesh then we don't use an index buffer and use drawArrays instead of drawElements
                if (object.type === "mesh" || object.type === "light") {
                    gl.drawArrays(gl.TRIANGLES, offset, object.buffers.numVertices / 3);
                } else {
                    gl.drawElements(gl.TRIANGLES, object.buffers.numVertices, gl.UNSIGNED_SHORT, offset);
                }
                
            }
        }
    });
}

function returnMat4Legibly(matrix)
{
    let mat4 = {
        i: [], //x
        j: [], //y
        k: [], //z
        w: []
    }
    for (var i = 0; i < 4; i++)
    {
        mat4.i.push(matrix[i]);
        mat4.j.push(matrix[i + 4]);
        mat4.k.push(matrix[i + 4 * 2]);
        mat4.w.push(matrix[i + 4 * 3]);
    }
    //console.log(mat4);

    return mat4;
}

function returnMat4Logically(matrix)
{
    let mat4 = {
        x: [], //x
        y: [], //y
        z: [], //z
        w: []
    }
    for (var i = 0; i < 4; i++)
    {
        mat4.x.push(matrix[i * 4]);
        mat4.y.push(matrix[i * 4 + 1]);
        mat4.z.push(matrix[i * 4 + 2]);
        mat4.w.push(matrix[i * 4 + 3]);
    }
    //console.log(mat4);

    return mat4;
}

function rotateRoundZ(matrix, rad){
    let temp = mat4.create();
    mat4.rotateZ(temp, temp, rad);
    mat4.mul(matrix, temp, matrix);
    return matrix.map(element => Math.round(element))
}

function rotateRoundX(matrix, rad){
    let temp = mat4.create();
    mat4.rotateX(temp, temp, rad);
    mat4.mul(matrix, temp, matrix);
    return matrix.map(element => Math.round(element))
}

function rotateRoundY(matrix, rad){
    let temp = mat4.create();
    mat4.rotateY(temp, temp, rad);
    mat4.mul(matrix, temp, matrix);
    return matrix.map(element => Math.round(element))
}