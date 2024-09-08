FROM alpine:3.19.4
COPY data.tar /
RUN tar xvf /data.tar -C /

FROM alpine:3.19.4
COPY --from=0 /data/ /data
