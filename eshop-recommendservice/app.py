import time
import os
import random
import requests
from flask import Flask

from jaeger_client import Config

_url_productservice = os.environ.get("URL_PRODUCTSERVICE", default='http://localhost:8080/')
app = Flask(__name__)


def init_conf():
    config = Config(
        config={  # usually read from some yaml config
            'sampler': {
                'type': 'const',
                'param': 1,
            },
            'local_agent': {
                'reporting_host': "eshop-jaeger-agent",
                'reporting_port': 6831,
            },
            'logging': True,
        },
        service_name='eshop-recommendservice.eshop',
        validate=True,
    )
    cfgtracer = config.initialize_tracer()
    return cfgtracer


##
tracer = init_conf()


@app.route("/api/recommends", methods=['GET'])
def recommend():
    ##
    with tracer.start_span('GET-api-recommends') as span:
        ##
        # span.log_kv({'event': 'recommend'})
        span.set_tag('success: get all recommendations information', "ingress recommend")
    # time.sleep(2)  # yield to IOLoop to flush the spans - https://github.com/jaegertracing/jaeger-client-python/issues/50
    # tracer.close()  # flush any buffered spans

    # 상품 목록을 조회한다.
    response = requests.get(_url_productservice + "/api/products")
    products = response.json()
    # 랜덤한 4개의 상품을 추천한다.
    recommendations = {'recommendations': random.sample(products['products'], 4)}
    print("recommendations : {}".format(recommendations))

    ##
    with tracer.start_span('GET-api-recommends-products') as span:
        ##
        # span.log_kv({'event': 'recommend'})
        span.set_tag('success: get all recommendations information', recommendations)
    #time.sleep(2)  # yield to IOLoop to flush the spans - https://github.com/jaegertracing/jaeger-client-python/issues/50
    #tracer.close()  # flush any buffered spans

    return recommendations