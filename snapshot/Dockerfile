FROM alpine:3.19.6
COPY data.tar /
RUN tar xvf /data.tar -C /

FROM alpine:3.19.6
COPY --from=0 /data/ /data
