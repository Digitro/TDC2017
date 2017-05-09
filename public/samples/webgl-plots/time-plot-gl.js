class TimePlotGL extends PlotGL {
    fragmentShader () {
        const res = "" +
            "precision mediump float;" +
            "varying vec2 vTextureCoord;" +
            "uniform sampler2D uTextureData;" +

            "void main(void){" +
                "float alpha;" +
                "float distance = 0.025;" +
                "vec3 fillColor = vec3(0.0, 0.0, 0.0);" +
                "vec4 sample = texture2D(uTextureData, vec2(vTextureCoord.x, 0));" +
                "if (vTextureCoord.y > sample.a + distance){" +
                    "alpha = 0.0;" +
                "} else if (vTextureCoord.y >= sample.a){" +
                    "alpha = (distance + sample.a - vTextureCoord.y)/distance;" +
                "} else if (vTextureCoord.y > sample.a - distance){" +
                    "alpha = (distance + vTextureCoord.y - sample.a)/distance;" +
                "} else {" +
                    "alpha = 0.0;" +
                "}" +
                "gl_FragColor = vec4(fillColor, alpha);" +
            "}";
       return res;
    }
}
