const express = require("express");
const app = express();
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const Product = require("./product-model")

dotenv.config();

const port = process.env.PORT;

const initTracer = require("jaeger-client").initTracer;
const { Tags, FORMAT_HTTP_HEADERS } = require('opentracing');

const tracer = initTracer(
    {
        serviceName: "eshop-productservice.eshop",
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

let db = mongoose.connection;
db.on("error", console.error);
db.on("connected", function () {
    console.log("Connected to mongod server");
    if (process.env.INIT_DATA) {
        console.log("initializing product data...");
        Product.initProduct(Product);
    }
});
db.on('disconnected', function () {
    console.log('MongoDB disconnected!');
    setTimeout(() => connect(), 5000);
});
var connect = function () {
    mongoose.connect(process.env.MONGO_URI, {
        useUnifiedTopology: true,
        useNewUrlParser: true,
    });
}
connect();

app.get("/api/products", async (req, res) => {
    const parentSpanContext = tracer.extract(FORMAT_HTTP_HEADERS, req.headers);
    const span = tracer.startSpan(`getAllProducts`, {
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

    if (req.query.ids) {
        const ids = req.query.ids.split(",");
        console.log("Filtered Product List : ", ids);
        const findResults = await Product.find({ id: { $in: ids } });
        const result = {
            products: findResults,
        };
        console.log("Filtered Products : " + JSON.stringify(result));
        res.send(result);
    } else {
        console.log("All Product List");
        const allProducts = await Product.find();
        const result = {
            products: allProducts,
        };
        res.send(result);
    }
    span.finish();
});

app.get("/api/products/:id", async (req, res) => {
    const parentSpanContext = tracer.extract(FORMAT_HTTP_HEADERS, req.headers);
    const span = tracer.startSpan(`getRequestedProduct`, {
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

    const requestedId = req.params.id;
    console.log("Requested Product : " + requestedId);
    const result = await Product.findOne({ id: requestedId });
    console.log("Found Product : " + JSON.stringify(result));
    res.send(result);

    span.finish();
});

app.listen(port, function () {
    console.log("Product Catalog service has started on port " + port);
});