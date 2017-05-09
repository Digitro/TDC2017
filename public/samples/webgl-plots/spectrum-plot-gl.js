class SpectrumPlotGL extends PlotGL {
    fragmentShader () {
        const res = "" +
            "precision mediump float;" +
            "varying vec2 vTextureCoord;" +
            "uniform sampler2D uTextureData;" +

            "void main(void){" +
                "float alpha;" +
                "float border = 0.01;" +
                "vec3 fillColor = vec3(0.0, 0.0, 0.0);" +
                "vec4 sample = texture2D(uTextureData, vec2(vTextureCoord.x, 0));" +

                "if (vTextureCoord.y > sample.a + border){" +
                    "alpha = 0.0;" +
                "} else if (vTextureCoord.y >= sample.a){" +
                    "alpha = 1.0;" +
                "} else {" +
                    "alpha = 1.0 - exp(-vTextureCoord.y * 1.5);" +
                "}" +
                "gl_FragColor = vec4(fillColor, alpha);" +
            "}";
       return res;
    }
}
