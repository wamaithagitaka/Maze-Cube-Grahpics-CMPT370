main();

/************************************
 * MAIN
 ************************************/


function main() {

    console.log("Setting up the canvas");

    // Find the canavas tag in the HTML document
    const canvas = document.querySelector("#assignmentCanvas");

    // Initialize the WebGL2 context
    var gl = canvas.getContext("webgl2");

    // Only continue if WebGL2 is available and working
    if (gl === null) {
        printError('WebGL 2 not supported by your browser',
            'Check to see you are using a <a href="https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API#WebGL_2_2" class="alert-link">modern browser</a>.');
        return;
    }

    // Hook up the button
    const fileUploadButton = document.querySelector("#fileUploadButton");
    fileUploadButton.addEventListener("click", () => {
        console.log("Submitting file...");
        let fileInput = document.getElementById('inputFile');
        let files = fileInput.files;
        let url = URL.createObjectURL(files[0]);

        fetch(url, {
            mode: 'no-cors' // 'cors' by default
        }).then(res => {
            return res.text();
        }).then(data => {
            var inputTriangles = JSON.parse(data);

            doDrawing(gl, canvas, inputTriangles);

        }).catch((e) => {
            console.error(e);
        });

    });
}

function doDrawing(gl, canvas, inputTriangles) {
    // Create a state for our scene

    var state = {
        camera: {
            position: vec3.fromValues(0.5, 0.5, -0.5),
            center: vec3.fromValues(0.5, 0.5, 0.0),
            up: vec3.fromValues(0.0, 1.0, 0.0),
            right: vec3.fromValues(-1.0, 0.0, 0.0),
            at: vec3.fromValues(0.0, 0.0, 1.0),
        },
        objects: [],
        canvas: canvas,
        selectedIndex: 0,
        hasSelected: false,
    };

    for (var i = 0; i < inputTriangles.length; i++) {
        state.objects.push(
            {
                name: inputTriangles[i].name,
                model: {
                    position: vec3.fromValues(0.0, 0.0, 0.5),
                    rotation: mat4.create(), // Identity matrix
                    scale: vec3.fromValues(1.0, 1.0, 1.0),
                },
                // this will hold the shader info for each object
                programInfo: transformShader(gl),
                buffers: undefined,
                // TODO: Add more object specific state like material color, centroid ... 
                material: vec4.fromValues(inputTriangles[i].material.diffuse[0], inputTriangles[i].material.diffuse[1],
                    inputTriangles[i].material.diffuse[2], 1),
                //relativePosition: vec3.create(), //'centroid' an offset from the world coordinate used for rotations
                centroid: calculateCentroid(inputTriangles[i].vertices),
                parent: inputTriangles[i].parent,
                parentObject: undefined,
                modelMatrix: mat4.create(),
            }
        );

        initBuffers(gl, state.objects[i], inputTriangles[i].vertices.flat(), inputTriangles[i].triangles.flat());
    }

    
    for (var i = 0; i < state.objects.length; i++) {
        for (var j = 0; j < state.objects.length; j++) {
            if (state.objects[i].parent === state.objects[j].name)
                state.objects[i].parentObject = state.objects[j];
        }
    }

    setupKeypresses(state);

    //console.log(state)

    console.log("Starting rendering loop");
    startRendering(gl, state);
}


/************************************
 * RENDERING CALLS
 ************************************/

function startRendering(gl, state) {
    // A variable for keeping track of time between frames
    var then = 0.0;

    // This function is called when we want to render a frame to the canvas
    function render(now) {
        now *= 0.001; // convert to seconds
        const deltaTime = now - then;
        then = now;

        // Draw our scene
        drawScene(gl, deltaTime, state);

        // Request another frame when this one is done
        requestAnimationFrame(render);
    }

    // Draw the scene
    requestAnimationFrame(render);
}

/**
 * Draws the scene. Should be called every frame
 * 
 * @param  {} gl WebGL2 context
 * @param {number} deltaTime Time between each rendering call
 */
function drawScene(gl, deltaTime, state) {
    // Set clear colour
    // This is a Red-Green-Blue-Alpha colour
    // See https://en.wikipedia.org/wiki/RGB_color_model
    // Here we use floating point values. In other places you may see byte representation (0-255).
    gl.clearColor(0.55686, 0.54902, 0.52157, 1.0);

    // Depth testing allows WebGL to figure out what order to draw our objects such that the look natural.
    // We want to draw far objects first, and then draw nearer objects on top of those to obscure them.
    // To determine the order to draw, WebGL can test the Z value of the objects.
    // The z-axis goes out of the screen
    gl.enable(gl.DEPTH_TEST); // Enable depth testing
    gl.depthFunc(gl.LEQUAL); // Near things obscure far things
    gl.clearDepth(1.0); // Clear everything

    // Clear the color and depth buffer with specified clear colour.
    // This will replace everything that was in the previous frame with the clear colour.
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    state.objects.forEach((object) => {
        // Choose to use our shader
        gl.useProgram(object.programInfo.program);

        // TODO Update uniforms with state variables values
        {
            var projectionMatrix 
            // TODO setup projection matrix (this doesn't change) DONE
            var projectionMatrix = mat4.create();

            // use same params as in the lab5 example
            // fovy = 60deg, near=0.1, far=100
            var fovy = 60.0 * Math.PI / 180.0; // Vertical field of view in radians
            var near = 0.1; // Near clipping plane
            var far = 100.0; // Far clipping plane
            var aspect = state.canvas.clientWidth / state.canvas.clientHeight; // Aspect ratio of the canvas

            // Generate the projection matrix using perspective
            mat4.perspective(projectionMatrix, fovy, aspect, near, far);

            // link to corresponding uniform object.programInfo.uniformLocations.[...]
            gl.uniformMatrix4fv(object.programInfo.uniformLocations.projection, false, projectionMatrix); //fov

            // TODO update view matrix with state.camera
            // use mat4.lookAt to generate the view matrix
            var viewMatrix = mat4.create();
            mat4.lookAt(
                viewMatrix,
                state.camera.position,
                state.camera.center,
                state.camera.up,
            );
            // link to corresponding uniform object.programInfo.uniformLocations.[...]
            gl.uniformMatrix4fv(object.programInfo.uniformLocations.view, false, viewMatrix);
            
            // TODO Update model transform
            // apply modeling transformations in correct order using
            // object.model.position, object.model.rotation, object.model.scale
            var modelMatrix = mat4.create();

            mat4.translate(modelMatrix, modelMatrix, object.model.position);
            mat4.translate(modelMatrix, modelMatrix, object.centroid); //translate

            mat4.mul(modelMatrix, modelMatrix, object.model.rotation); //rotate
            mat4.scale(modelMatrix, modelMatrix, object.model.scale); //scale
            var neg = vec3.create();
            vec3.negate(neg, object.centroid);
            mat4.translate(modelMatrix, modelMatrix, neg); //translate

            object.modelMatrix = modelMatrix;

            // //Do the parent-children stuff
            // if (object.parent != null) {
                // mat4.multiply(modelMatrix, object.parentObject.modelMatrix, modelMatrix);
            // }

            object.modelMatrix = modelMatrix;

            // link to corresponding uniform object.programInfo.uniformLocations.[...]
            gl.uniformMatrix4fv(object.programInfo.uniformLocations.model, false, modelMatrix);

            // TODO Update other uniforms like colors DONE
            var materialVector = vec4.fromValues(0.0, 0.0, 0.0, 1.0);
            materialVector = object.material;
            gl.uniform4fv(object.programInfo.uniformLocations.material, materialVector);
        }
        // Draw 
        {
            // Bind the buffer we want to draw
            gl.bindVertexArray(object.buffers.vao);

            // Draw the object
            const offset = 0; // Number of elements to skip before starting
            gl.drawElements(gl.TRIANGLES, object.buffers.numVertices, gl.UNSIGNED_SHORT, offset);
        }
    });
}


/************************************
 * UI EVENTS
 ************************************/

function setupKeypresses(state) {
    document.addEventListener("keydown", (event) => {
        //console.log(event.code);

        //console.log(state.hasSelected);
        var object = state.objects[state.selectedIndex];
        switch (event.code) {
            case "KeyA":
                if (event.getModifierState("Shift")) {
                    if (state.hasSelected) {
                        // TODO Rotate selected object around Y 
                        mat4.rotate(object.model.rotation, object.model.rotation, -0.1, vec3.fromValues(0.0, 1.0, 0.0));
                    } else {
                        // TODO Rotate camera around Y 
                        //do the thing
                        var delta = state.camera.right;
                        vec3.scale(delta, delta, -0.1);
                        vec3.add(state.camera.center, state.camera.center, delta); //have to do something with the z axis too?

                        //correct/calculate our at
                        vec3.sub(state.camera.at, state.camera.position, state.camera.center);
                        vec3.normalize(state.camera.at, state.camera.at);
                        //correct our right value
                        vec3.cross(state.camera.right, state.camera.at, state.camera.up);
                        vec3.normalize(state.camera.right, state.camera.right);
                    }
                } else {
                    if (state.hasSelected) {
                        // TODO: Move selected object along X axis
                        vec3.add(object.model.position, object.model.position, vec3.fromValues(0.1, 0.0, 0.0));
                    } else {
                        // TODO: Move camera along X axis
                        vec3.add(state.camera.center, state.camera.center, vec3.fromValues(-0.1, 0.0, 0.0));
                        vec3.add(state.camera.position, state.camera.position, vec3.fromValues(-0.1, 0.0, 0.0));
                    }
                }
                break;
            case "KeyD":
                if (event.getModifierState("Shift")) {
                    if (state.hasSelected) {
                        // TODO Rotate selected object around Y (other direction)
                        mat4.rotate(object.model.rotation, object.model.rotation, 0.1, vec3.fromValues(0.0, 1.0, 0.0));
                    } else {
                        // TODO Rotate camera around Y (other direction) 
                        //do the thing
                        var delta = state.camera.right;
                        vec3.scale(delta, delta, 0.1);
                        vec3.add(state.camera.center, state.camera.center, delta); //have to do something with the z axis too?

                        //correct/calculate our at
                        vec3.sub(state.camera.at, state.camera.position, state.camera.center);
                        vec3.normalize(state.camera.at, state.camera.at);
                        //correct our right value
                        vec3.cross(state.camera.right, state.camera.at, state.camera.up);
                        vec3.normalize(state.camera.right, state.camera.right);
                    }
                } else {
                    if (state.hasSelected) {
                        // TODO: Move selected object along X axis (other direction)
                        vec3.add(object.model.position, object.model.position, vec3.fromValues(-0.1, 0.0, 0.0));
                    } else {
                        // TODO: Move camera along X axis (other direction)
                        vec3.add(state.camera.center, state.camera.center, vec3.fromValues(0.1, 0.0, 0.0));
                        vec3.add(state.camera.position, state.camera.position, vec3.fromValues(0.1, 0.0, 0.0));
                    }
                }
                break;
            case "KeyW":
                if (event.getModifierState("Shift")) {
                    if (state.hasSelected) {
                        // TODO: rotate selection forward and backward around view X
                        mat4.rotate(object.model.rotation, object.model.rotation, 0.1, vec3.fromValues(1.0, 0.0, 0.0));
                    } else {
                        //do the thing
                        var delta = state.camera.up;
                        vec3.scale(delta, delta, -0.1);
                        vec3.add(state.camera.center, state.camera.center, delta); //have to do something with the z axis too?

                        // TODO: Rotate camera about X axis (pitch)
                        //correct/calculate our at 
                        vec3.sub(state.camera.at, state.camera.position, state.camera.center);
                        vec3.normalize(state.camera.at, state.camera.at);
                        //vec3.negate(state.camera.up, state.camera.up);

                        //do the up
                        vec3.cross(state.camera.up, state.camera.right, state.camera.at);
                        vec3.normalize(state.camera.up, state.camera.up);
                    }
                } else {
                    if (state.hasSelected) {
                        // TODO: Move selected object along Z axis
                        vec3.add(object.model.position, object.model.position, vec3.fromValues(0.0, 0.0, 0.1));
                    } else {
                        // TODO: Move camera along Z axis
                        vec3.add(state.camera.center, state.camera.center, vec3.fromValues(0.0, 0.0, -0.1));
                        vec3.add(state.camera.position, state.camera.position, vec3.fromValues(0.0, 0.0, -0.1));
                    }
                }
                break;
            case "KeyS":
                if (event.getModifierState("Shift")) {
                    if (state.hasSelected) {
                        // TODO: rotate selection forward and backward around view X (other direction)
                        mat4.rotate(object.model.rotation, object.model.rotation, -0.1, vec3.fromValues(1.0, 0.0, 0.0));
                    } else {
                        // TODO: Rotate camera about X axis (pitch)
                        //do the thing
                        var delta = state.camera.up;
                        vec3.scale(delta, delta, 0.1);
                        vec3.add(state.camera.center, state.camera.center, delta); //have to do something with the z axis too?

                        // TODO: Rotate camera about X axis (pitch)
                        //correct/calculate our at 
                        vec3.sub(state.camera.at, state.camera.position, state.camera.center);
                        vec3.normalize(state.camera.at, state.camera.at);
                        //vec3.negate(state.camera.up, state.camera.up);

                        //do the up
                        vec3.cross(state.camera.up, state.camera.right, state.camera.at);
                        vec3.normalize(state.camera.up, state.camera.up);
                    }
                } else {
                    if (state.hasSelected) {
                        // TODO: Move selected object along Z axis  (other direction)
                        vec3.add(object.model.position, object.model.position, vec3.fromValues(0.0, 0.0, -0.1));
                    } else {
                        // TODO: Move camera along Z axis (other direction)
                        vec3.add(state.camera.center, state.camera.center, vec3.fromValues(0.0, 0.0, 0.1));
                        vec3.add(state.camera.position, state.camera.position, vec3.fromValues(0.0, 0.0, 0.1));
                    }
                }
                break;
            case "KeyQ":
                if (event.getModifierState("Shift")) {
                    if (state.hasSelected) {
                        // TODO : rotate selected object around z axis
                        mat4.rotate(object.model.rotation, object.model.rotation, -0.1, vec3.fromValues(0.0, 0.0, 1.0));
                    }
                } else {
                    if (state.hasSelected) {
                        // TODO : move selected object along Y axis 
                        vec3.add(object.model.position, object.model.position, vec3.fromValues(0.0, -0.1, 0.0));
                    } else {
                        // TODO: move camera along Y axis
                        vec3.add(state.camera.center, state.camera.center, vec3.fromValues(0.0, -0.1, 0.0));
                        vec3.add(state.camera.position, state.camera.position, vec3.fromValues(0.0, -0.1, 0.0));
                    }
                }

                break;
            case "KeyE":
                if (event.getModifierState("Shift")) {
                    if (state.hasSelected) {
                        // TODO : rotate selected object around z axis
                        mat4.rotate(object.model.rotation, object.model.rotation, 0.1, vec3.fromValues(0.0, 0.0, 1.0));
                    }
                } else {
                    if (state.hasSelected) {
                        // TODO : move selected object along Y axis 
                        vec3.add(object.model.position, object.model.position, vec3.fromValues(0.0, 0.1, 0.0));
                    } else {
                        // TODO: move camera along Y axis
                        vec3.add(state.camera.center, state.camera.center, vec3.fromValues(0.0, 0.1, 0.0));
                        vec3.add(state.camera.position, state.camera.position, vec3.fromValues(0.0, 0.1, 0.0));
                    }
                }
                break;
            case "Space":
                // TODO: Highlight
                if (!state.hasSelected) {
                    state.hasSelected = true;
                    changeSelectionText(state.objects[state.selectedIndex].name);
                    // TODO scale object here 
                    vec3.scale(object.model.scale, object.model.scale, 1.2);

                }
                else {
                    state.hasSelected = false;
                    document.getElementById("selectionText").innerHTML = "Selection: None";
                    // TODO scale back object here 
                    vec3.scale(object.model.scale, object.model.scale, 1 / 1.2);
                }

                break;
            case "ArrowLeft":
                // Decreases object selected index value
                if (state.hasSelected) {
                    if (state.selectedIndex > 0) {
                        //TODO: scale the selected object and descale the previously selected object, set state.selectedIndex to new value
                        vec3.scale(state.objects[state.selectedIndex].model.scale, state.objects[state.selectedIndex].model.scale, 1 / 1.1);
                        state.selectedIndex--;
                        vec3.scale(state.objects[state.selectedIndex].model.scale, state.objects[state.selectedIndex].model.scale, 1.1);
                    }
                    else if (state.selectedIndex == 0) {
                        //TODO: scale the selected object and descale the previously selected object, set state.selectedIndex to new value
                        vec3.scale(state.objects[state.selectedIndex].model.scale, state.objects[state.selectedIndex].model.scale, 1 / 1.1);
                        state.selectedIndex = state.objects.length - 1;
                        vec3.scale(state.objects[state.selectedIndex].model.scale, state.objects[state.selectedIndex].model.scale, 1.1);
                    }
                    else {
                        //TODO: scale the selected object and descale the previously selected object, set state.selectedIndex to new value
                        vec3.scale(state.objects[state.selectedIndex].model.scale, state.objects[state.selectedIndex].model.scale, 1 / 1.1);
                        state.selectedIndex--;
                        vec3.scale(state.objects[state.selectedIndex].model.scale, state.objects[state.selectedIndex].model.scale, 1.1);
                    }
                    //changes the text to the object that is selected
                    changeSelectionText(state.objects[state.selectedIndex].name);
                }
                break;
            case "ArrowRight":
                // Increases object selected index value
                if (state.hasSelected) {
                    if (state.selectedIndex < state.objects.length - 1) {
                        //TODO: scale the selected object and descale the previously selected object, set state.selectedIndex to new value
                        vec3.scale(state.objects[state.selectedIndex].model.scale, state.objects[state.selectedIndex].model.scale, 1 / 1.1);
                        state.selectedIndex++;
                        vec3.scale(state.objects[state.selectedIndex].model.scale, state.objects[state.selectedIndex].model.scale, 1.1);
                    }
                    else {
                        //TODO: scale the selected object and descale the previously selected object, set state.selectedIndex to new value
                        vec3.scale(state.objects[state.selectedIndex].model.scale, state.objects[state.selectedIndex].model.scale, 1 / 1.1);
                        state.selectedIndex = 0;
                        vec3.scale(state.objects[state.selectedIndex].model.scale, state.objects[state.selectedIndex].model.scale, 1.1);
                    }
                    changeSelectionText(state.objects[state.selectedIndex].name);
                }
                break;
            default:
                break;
        }
    });
}

/************************************
 * SHADER SETUP
 ************************************/
function transformShader(gl) {
    // Vertex shader source code
    const vsSource =
    `#version 300 es
    in vec3 aPosition;

    // TODO add uniforms for projection, view and model matrices DONE
    uniform mat4 uProjectionMatrix;
    uniform mat4 uViewMatrix;
    uniform mat4 uModelMatrix;
   
 
    void main() {
        // Position needs to be a vec4 with w as 1.0
        // TODO apply transformation stored in uniforms DONE
        gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * vec4(aPosition, 1.0);
        
    }
    `;

    // Fragment shader source code
    const fsSource =
        `#version 300 es
    precision highp float;

    out vec4 fragColor;
    
    // TODO: add uniform for object material color DONE
    uniform vec4 uMaterialColor;
    
    void main() {
        // TODO: replace with corresponding color from uniform DONE
        fragColor = uMaterialColor; //vec4(1.0,0.0,0.0, 1.0);
    }
    `;

    // Create our shader program with our custom function
    const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

    // Collect all the info needed to use the shader program.
    const programInfo = {
        // The actual shader program
        program: shaderProgram,
        // The attribute locations. WebGL will use there to hook up the buffers to the shader program.
        // NOTE: it may be wise to check if these calls fail by seeing that the returned location is not -1.
        attribLocations: {
            vertexPosition: gl.getAttribLocation(shaderProgram, 'aPosition'),
        },
        uniformLocations: {
            // TODO: add the locations for the 3 uniforms related to projection, view, modeling transforms DONE
            projection: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
            view: gl.getUniformLocation(shaderProgram, 'uViewMatrix'),
            model: gl.getUniformLocation(shaderProgram, 'uModelMatrix'),

            // TODO: Add location to additional uniforms here (ex related to material color) DONE
            material: gl.getUniformLocation(shaderProgram, 'uMaterialColor'), 
        },
    };

    // Check to see if we found the locations of our uniforms and attributes
    // Typos are a common source of failure
    // TODO add testes for all your uniform locations 
    if (programInfo.attribLocations.vertexPosition === -1 ||
		programInfo.uniformLocations.projection === -1 || 
		programInfo.uniformLocations.view === -1 ||
		programInfo.uniformLocations.model === -1 ||
		programInfo.uniformLocations.material === -1) {

        printError('Shader Location Error', 'One or more of the uniform and attribute variables in the shaders could not be located');
    }

    return programInfo;
}

/************************************
 * BUFFER SETUP
 ************************************/

function initBuffers(gl, object, positionArray, indicesArray) {

    // We have 3 vertices with x, y, and z values
    const positions = new Float32Array(positionArray);

    // We are using gl.UNSIGNED_SHORT to enumerate the indices
    const indices = new Uint16Array(indicesArray);


    // Allocate and assign a Vertex Array Object to our handle
    var vertexArrayObject = gl.createVertexArray();

    // Bind our Vertex Array Object as the current used object
    gl.bindVertexArray(vertexArrayObject);

    object.buffers = {
        vao: vertexArrayObject,
        attributes: {
            position: initPositionAttribute(gl, object.programInfo, positions),
        },
        indices: initIndexBuffer(gl, indices),
        numVertices: indices.length,
    };
}

function initPositionAttribute(gl, programInfo, positionArray) {

    // Create a buffer for the positions.
    const positionBuffer = gl.createBuffer();

    // Select the buffer as the one to apply buffer
    // operations to from here out.
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    // Now pass the list of positions into WebGL to build the
    // shape. We do this by creating a Float32Array from the
    // JavaScript array, then use it to fill the current buffer.
    gl.bufferData(
        gl.ARRAY_BUFFER, // The kind of buffer this is
        positionArray, // The data in an Array object
        gl.STATIC_DRAW // We are not going to change this data, so it is static
    );

    // Tell WebGL how to pull out the positions from the position
    // buffer into the vertexPosition attribute.
    {
        const numComponents = 3; // pull out 3 values per iteration, ie vec3
        const type = gl.FLOAT; // the data in the buffer is 32bit floats
        const normalize = false; // don't normalize between 0 and 1
        const stride = 0; // how many bytes to get from one set of values to the next
        // Set stride to 0 to use type and numComponents above
        const offset = 0; // how many bytes inside the buffer to start from


        // Set the information WebGL needs to read the buffer properly
        gl.vertexAttribPointer(
            programInfo.attribLocations.vertexPosition,
            numComponents,
            type,
            normalize,
            stride,
            offset
        );
        // Tell WebGL to use this attribute
        gl.enableVertexAttribArray(
            programInfo.attribLocations.vertexPosition);
    }

    return positionBuffer;
}


function initColourAttribute(gl, programInfo, colourArray) {

    // Create a buffer for the positions.
    const colourBuffer = gl.createBuffer();

    // Select the buffer as the one to apply buffer
    // operations to from here out.
    gl.bindBuffer(gl.ARRAY_BUFFER, colourBuffer);

    // Now pass the list of positions into WebGL to build the
    // shape. We do this by creating a Float32Array from the
    // JavaScript array, then use it to fill the current buffer.
    gl.bufferData(
        gl.ARRAY_BUFFER, // The kind of buffer this is
        colourArray, // The data in an Array object
        gl.STATIC_DRAW // We are not going to change this data, so it is static
    );

    // Tell WebGL how to pull out the positions from the position
    // buffer into the vertexPosition attribute.
    {
        const numComponents = 4; // pull out 4 values per iteration, ie vec4
        const type = gl.FLOAT; // the data in the buffer is 32bit floats
        const normalize = false; // don't normalize between 0 and 1
        const stride = 0; // how many bytes to get from one set of values to the next
        // Set stride to 0 to use type and numComponents above
        const offset = 0; // how many bytes inside the buffer to start from

        // Set the information WebGL needs to read the buffer properly
        gl.vertexAttribPointer(
            programInfo.attribLocations.vertexColour,
            numComponents,
            type,
            normalize,
            stride,
            offset
        );
        // Tell WebGL to use this attribute
        gl.enableVertexAttribArray(
            programInfo.attribLocations.vertexColour);
    }

    return colourBuffer;
}

function initIndexBuffer(gl, elementArray) {

    // Create a buffer for the positions.
    const indexBuffer = gl.createBuffer();

    // Select the buffer as the one to apply buffer
    // operations to from here out.
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

    // Now pass the list of positions into WebGL to build the
    // shape. We do this by creating a Float32Array from the
    // JavaScript array, then use it to fill the current buffer.
    gl.bufferData(
        gl.ELEMENT_ARRAY_BUFFER, // The kind of buffer this is
        elementArray, // The data in an Array object
        gl.STATIC_DRAW // We are not going to change this data, so it is static
    );

    return indexBuffer;
}

/**
 * 
 * @param {array of x,y,z vertices} vertices 
 */
function calculateCentroid(vertices) {

    var center = vec3.fromValues(0.0, 0.0, 0.0);
    for (let t = 0; t < vertices.length; t++) {
        vec3.add(center, center, vertices[t]);
    }
    vec3.scale(center, center, 1 / vertices.length);
    return center;

}
