# TDC2017

Repositório contendo a apresentação e todos os códigos de demonstração usados na palestra "Integrando WebRTC, WebGL e WebAudio API" do TDC2017.

# Requisitos

```shell
nodejs 7.9.x
yarn 0.22.x
```

# Rodando...

```shell
yarn add
node index.js
```

Basta acessar:

* 127.0.0.1:8000/ : Apresentação
* 127.0.0.1:8000/samples/local-peer/ : Exemplo de acesso aos dispositivos (microfone e câmera) locais
* 127.0.0.1:8000/samples/peer-to-peer/tdc2017 : Exemplo de sala de conferência
* 127.0.0.1:8000/samples/webaudio-reverb/ : Exemplo com efeito de reverberação aplicado ao áudio do microfone local
* 127.0.0.1:8000/samples/webgl-plots/ : Exemplo contendo representações gráficas do áudio proveniente do microfone local
* 127.0.0.1:8000/samples/showroom/tdc2017 : Exemplo contendo representações gráficas do áudio proveniente do áudio remoto
