FROM alpine:3.21.2
COPY data.tar /
RUN tar xvf /data.tar -C /

FROM alpine:3.21.2
COPY --from=0 /data/ /data
