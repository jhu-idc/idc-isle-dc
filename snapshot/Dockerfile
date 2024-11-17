FROM alpine:3.20.3
COPY data.tar /
RUN tar xvf /data.tar -C /

FROM alpine:3.20.3
COPY --from=0 /data/ /data
