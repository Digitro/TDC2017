class PlotGL {
    constructor (canvas, dataSize, snapshots) {
        const gl = canvas.getContext("webgl", {premultipliedAlpha: false})
            || canvas.getContext("webgl-experimental", {premultipliedAlpha: false});
        if (!gl) throw new Error("Falha ao contextualizar o WebGL. Verificar SUPORTE.");
        gl.clearColor(0.0, 0.0, 0.0, 0.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.viewport(0, 0, canvas.width, canvas.height);

        if (!snapshots) snapshots = 1;

        this._dataSize = dataSize;
        this._snapshots = snapshots;
        this._canvas = canvas;
        this._gl = gl;

        this.loadShaders(this.vertexShader(), this.fragmentShader());
        this.setBuffers(dataSize, snapshots);
        this.bind();
        this.resize();
    }

    vertexShader () {
        const res = "" +
            "attribute vec2 aVertexPosition;" +
            "attribute vec2 aTextureCoord;" +
            "varying vec2 vTextureCoord;" +

            "void main(void) {" +
                "gl_Position = vec4(aVertexPosition, 0.0, 1.0);" +
                "vTextureCoord = aTextureCoord;" +
            "}";
        return res;
    }

    fragmentShader () {
        const res = "" +
            "void main(void){" +
                "gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);" +
            "}";
        return res;
    }

    bind () {
        const gl = this._gl;
        const glProgram = this._glProgram;

        this._uTextureData = gl.getUniformLocation(glProgram, "uTextureData");
        this._aVertexPosition = gl.getAttribLocation(glProgram, "aVertexPosition");
        this._aTextureCoord = gl.getAttribLocation(glProgram, "aTextureCoord");
    }

    makeShader (source, type) {
        const gl = this._gl;
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
            throw new Error("Erro ao compilar o shader de vertices: "
                + gl.getShaderInfoLog(shader));
        return shader;
    }

    loadShaders (vsSource, fsSource) {
        const gl = this._gl;
        const vertexShader = this.makeShader(vsSource, gl.VERTEX_SHADER)
        const fragmentShader = this.makeShader(fsSource, gl.FRAGMENT_SHADER);
        const glProgram = gl.createProgram();
        gl.attachShader(glProgram, vertexShader);
        gl.attachShader(glProgram, fragmentShader);
        gl.linkProgram(glProgram);
        if (!gl.getProgramParameter(glProgram, gl.LINK_STATUS))
            throw new Error("Nao foi possivel inicializar o programa dos shaders.");
        gl.useProgram(glProgram);
        this._vertexShader = vertexShader;
        this._fragmentShader = fragmentShader;
        this._glProgram = glProgram;
    }

    resize () {
        const gl = this._gl;
        const canvas = this._canvas;
        const displayWidth = canvas.clientWidth;
        const displayHeight = canvas.clientHeight;

        if (canvas.width != displayWidth || canvas.height != displayHeight){
            canvas.width = displayWidth;
            canvas.height = displayHeight;
            gl.viewport(0, 0, canvas.width, canvas.height);
        }
    }

    setBuffers (textureWidth, textureHeight) {
        const gl = this._gl;
        const vertices = new Float32Array([
            1.0, 1.0, -1.0, 1.0, -1.0, -1.0,
            1.0, 1.0, -1.0, -1.0, 1.0, -1.0]);

        const texCoords = new Float32Array([
            1.0, 1.0, 0.0, 1.0, 0.0, 0.0,
            1.0, 1.0, 0.0, 0.0, 1.0, 0.0]);

        if (this._verticesBuffer) gl.deleteBuffer(this._verticesBuffer);
        const verticesBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices.byteLength + texCoords.byteLength, gl.STATIC_DRAW);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, vertices);
        gl.bufferSubData(gl.ARRAY_BUFFER, vertices.byteLength, texCoords);

        if (this._texture) gl.deleteTexture(this._texture);
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        const tmp = new Uint8Array(textureWidth * textureHeight);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.ALPHA, textureWidth, textureHeight, 0, gl.ALPHA, gl.UNSIGNED_BYTE, tmp);

        this._bytesOffset = vertices.byteLength;
        this._verticesBuffer = verticesBuffer;
        this._texture = texture;
    }

    draw (data) {
        const gl = this._gl;
        const glProgram = this._glProgram;
        const texture = this._texture;
        const verticesBuffer = this._verticesBuffer;
        const bytesOffset = this._bytesOffset;
        const vertexPosition = this._aVertexPosition;
        const textureCoord = this._aTextureCoord;

        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
        gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0,
            data.length, 1, gl.ALPHA, gl.UNSIGNED_BYTE, data);

        gl.uniform1i(this._uTextureData, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);
        gl.enableVertexAttribArray(vertexPosition);
        gl.vertexAttribPointer(vertexPosition, 2, gl.FLOAT, gl.FALSE, 0, 0);

        gl.enableVertexAttribArray(textureCoord);
        gl.vertexAttribPointer(textureCoord, 2, gl.FLOAT, gl.FALSE, 0,
            bytesOffset);

        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        gl.disableVertexAttribArray(vertexPosition);
        gl.disableVertexAttribArray(textureCoord);
    }
}
