FROM alpine:3.21.0
COPY data.tar /
RUN tar xvf /data.tar -C /

FROM alpine:3.21.0
COPY --from=0 /data/ /data
