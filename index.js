const PORT = process.env.PORT || 8000;
const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const app = express();

app.get("/", (req, res) => {
  res.json(
    "Welcome to my peer of Tatra avalanche messages. This is my first API, so I realize it's not perfect. It uses the data contained on the website of TOPR avalanche messages, so if I ever get profits from the API, I will transfer them to TOPR. Now go to /v1/avalanche-risk"
  );
});

app.get("/v1/avalanche-risk", (req, res) => {
  axios
    .get("https://lawiny.topr.pl/")
    .then((response) => {
      const html = response.data;
      const $ = cheerio.load(html);
      let suspect = null;
      $("script", html).each(function () {
        if ($(this).html().indexOf("const oLawReport =") >= 0) {
          suspect = $(this).html();
        }
      });

      if (suspect) {
        oLawReport = extractJSON(suspect);

        const newHistory = [];
        for (let i in oLawReport[0].history) {
          const dayRisk = oLawReport[0].history[i];
          newHistory.push({
            date: dayRisk.dat,
            risk_level: dayRisk.lev,
          });
        }

        const lawReport = {
          id: oLawReport[0].id,
          created: oLawReport[0].iat,
          expires: oLawReport[0].exp,
          risk_level: oLawReport[0].mst.lev,
          history: newHistory,
          image_full: oLawReport[0].mst.img,
          image_risk:
            "https://lawiny.topr.pl/img/law/law0" +
            oLawReport[0].mst.lev +
            ".png",
          image_wet:
            "https://lawiny.topr.pl/img/law/law0" +
            oLawReport[0].mst.lev +
            oLawReport[0].mst.wet +
            ".png",
          am: halfFormat(oLawReport[0].am),
          pm: halfFormat(oLawReport[0].pm),
        };
        res.json(lawReport);
      } else {
        res.json("Something went wrong");
      }
    })
    .catch((err) => console.log(err));
});

app.listen(PORT, () => console.log(`server running on PORT ${PORT}`));

function halfFormat(hData) {
  return {
    risk_edge: hData.height,
    upper: {
      risk_level: hData.upper.lev,
    },
    lower: {
      risk_level: hData.lower.lev,
    },
    image: hData.img,
  };
}

function extractJSON(str) {
  var firstOpen, firstClose, candidate;
  firstOpen = str.indexOf("{", firstOpen + 1);
  do {
    firstClose = str.lastIndexOf("}");
    // console.log("firstOpen: " + firstOpen, "firstClose: " + firstClose);
    if (firstClose <= firstOpen) {
      return null;
    }
    do {
      candidate = str.substring(firstOpen, firstClose + 1);
      // console.log('candidate: ' + candidate);
      try {
        var res = JSON.parse(candidate);
        // console.log('...found');
        return [res, firstOpen, firstClose + 1];
      } catch (e) {
        // console.log('...failed');
      }
      firstClose = str.substr(0, firstClose).lastIndexOf("}");
    } while (firstClose > firstOpen);
    firstOpen = str.indexOf("{", firstOpen + 1);
  } while (firstOpen != -1);
}
