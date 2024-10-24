const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const data = require('./data/initial-data.json');
const dotenv = require('dotenv');
dotenv.config();

const port = process.env.PORT || 8094;

app.use(bodyParser.json());

const initTracer = require("jaeger-client").initTracer;
const { Tags, FORMAT_HTTP_HEADERS } = require('opentracing');

const tracer = initTracer(
  {
    serviceName: "eshop-currencyservice.eshop",
    sampler: {
      type: "const",
      param: 1,
    },
    reporter: {
      collectorEndpoint: "http://eshop-jaeger-collector:14268/api/traces",
      logSpans: false
    }
  },
  {
    logger: {
      info: (msg) => {
        console.log('INFO  ', msg);
      },
      error: (msg) => {
        console.log('ERROR ', msg);
      },
    },
  }
);

app.get('/api/currencies', (req, res) => {
  const parentSpanContext = tracer.extract(FORMAT_HTTP_HEADERS, req.headers);
  const span = tracer.startSpan(`getAllCurrencies`, {
    childOf: parentSpanContext,
    tags: {
      [Tags.SPAN_KIND]: Tags.SPAN_KIND_RPC_SERVER,
      [Tags.HTTP_URL]: req.url,
      [Tags.HTTP_METHOD]: req.method,
      [Tags.HTTP_STATUS_CODE]: res.statusCode
    }
  });

  console.log("Span ID: ", span.context().toSpanId());

  tracer.inject(span, FORMAT_HTTP_HEADERS, req.headers);

  console.log("All Currencies")
  res.send(data)
  span.finish();
})

app.post('/api/currencies/convert', (req, res) => {
  const from = req.body.from;
  const to_code = req.body.to_code;

  console.log("convert from : " + from.currencyCode + ", to : " + to_code + ", units : " + from.units + ", nanos :" + from.nanos);

  const euros = {
    units: from.units / data[from.currencyCode],
    nanos: Math.round(from.nanos / data[from.currencyCode])
  };

  const result = {
    currencyCode: to_code,
    units: Math.floor(euros.units * data[to_code]),
    nanos: Math.floor(euros.nanos * data[to_code])
  };

  res.send(JSON.stringify(result))
})

app.listen(port, function () {
  console.log("Currency service has started on port " + port)
})