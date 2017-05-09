class WaterfallPlotGL extends PlotGL {
    constructor (canvas, dataSize, snapshots) {
        super(canvas, dataSize, snapshots);
        this._yoffset = 0;
    }

    fragmentShader () {
        const res = "" +
            "precision mediump float;" +

            "varying vec2 vTextureCoord;" +
            "uniform sampler2D uTextureData;" +
            "uniform float uYoffset;" +

            "void main(void)" +
            "{" +
                "float x = vTextureCoord.x;" +
                "float y = vTextureCoord.y + uYoffset;" +

                "vec4 sample = texture2D(uTextureData, vec2(x, y));" +
                "float alpha = sample.a;" +
                "vec3 color = vec3(0.0, 0.0, 0.0);" +

                "gl_FragColor = vec4(color, alpha);" +
            "}";

        return res;
    }

    bind () {
        var gl = this._gl;
        var glProgram = this._glProgram;

        this._uTextureData = gl.getUniformLocation(glProgram, "uTextureData");
        this._aVertexPosition = gl.getAttribLocation(glProgram, "aVertexPosition");
        this._aTextureCoord = gl.getAttribLocation(glProgram, "aTextureCoord");
        this._uYoffset = gl.getUniformLocation(glProgram, "uYoffset");
    }

    draw (data) {
        const gl = this._gl;
        const glProgram = this._glProgram;
        const texture = this._texture;
        const verticesBuffer = this._verticesBuffer;
        const bytesOffset = this._bytesOffset;
        const snapshots = this._snapshots;
        const vertexPosition = this._aVertexPosition;
        const textureCoord = this._aTextureCoord;
        let yoffset = this._yoffset;

        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
        gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, yoffset, data.length, 1, gl.ALPHA, gl.UNSIGNED_BYTE, data);

        yoffset = (yoffset + 1) % snapshots;

        gl.uniform1i(this._uTextureData, 0);
        gl.uniform1f(this._uYoffset, yoffset / (snapshots - 1.0));

        gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);
        gl.enableVertexAttribArray(vertexPosition);
        gl.vertexAttribPointer(vertexPosition, 2, gl.FLOAT, gl.FALSE, 0, 0);

        gl.enableVertexAttribArray(textureCoord);
        gl.vertexAttribPointer(textureCoord, 2, gl.FLOAT, gl.FALSE, 0, bytesOffset);

        gl.clearColor(0.0, 0.0, 0.0, 0.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        gl.disableVertexAttribArray(vertexPosition);
        gl.disableVertexAttribArray(textureCoord);

        this._yoffset = yoffset;
    }
}
