FROM ubuntu:24.04 AS build

ENV DEBIAN_FRONTEND=noninteractive
ARG WHISPER_CPP_VERSION=v1.9.4

RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential ca-certificates cmake git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /src
RUN git clone --depth 1 --branch "${WHISPER_CPP_VERSION}" \
    https://github.com/ggml-org/whisper.cpp.git .

RUN cmake -S . -B build \
        -DCMAKE_BUILD_TYPE=Release \
        -DBUILD_SHARED_LIBS=OFF \
        -DGGML_NATIVE=OFF \
        -DWHISPER_BUILD_EXAMPLES=ON \
        -DWHISPER_BUILD_SERVER=ON \
    && cmake --build build --config Release --target whisper-server -j2

FROM ubuntu:24.04

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates libgomp1 \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build /src/build/bin/whisper-server /usr/local/bin/whisper-server

USER nobody
ENTRYPOINT ["whisper-server"]
