FROM alpine:3.22.1
COPY data.tar /
RUN tar xvf /data.tar -C /

FROM alpine:3.22.1
COPY --from=0 /data/ /data
