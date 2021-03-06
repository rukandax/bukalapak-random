const queryParams = extractParams() || {};

if (queryParams.category_id) {
  $("#product-filter-category").show();
}

$("#toggle-filter-category").on("click", function() {
  $("#product-filter-category").slideToggle();
});

function getCategories(token) {
  $.ajax({
    crossDomain: true,
    url:
      location.protocol +
      "//api.bukalapak.com/categories?access_token=" +
      token,
    success: function(data) {
      data.data.forEach(category => {
        let selected = "";
        if (queryParams.category_id == category.id) {
          selected = 'checked="checked"';
        }

        $("#product-filter-category").append(`
          <div class="product-filter-category-item">
            <input type="radio" name="category" id="radio-${category.id}" value="${category.id}" ${selected} onclick="window.location = window.location.pathname + '?category_id=${category.id}'">
            <label for="radio-${category.id}">${category.name}</label>
          </div>
        `);
      });
    }
  });
}

var firstTry = true;
var connectAttemp = 1;

function getProducts(token, limit = 1, offset = 0) {
  $.ajax({
    crossDomain: true,
    url:
      location.protocol +
      "//api.bukalapak.com/products?brand=true&category_id=" +
      (queryParams.category_id || "") +
      "&condition=new&limit=" +
      limit +
      "&offset=" +
      offset +
      "&rating=4%3A5&sort=date&top_seller=true&access_token=" +
      token,
    error: function() {
      if (connectAttemp <= 3) {
        connectAttemp += 1;
        getToken();
      } else {
        alert("Request cancelled by server. Please try again later.");
      }
    },
    success: function(data) {
      if (firstTry) {
        firstTry = false;
        const total = data.meta.total;
        let selectedOffset = offset;

        if (total > 50) {
          selectedOffset = parseInt(Math.random() * (total - 50));
        }

        getProducts(token, 50, selectedOffset);
      } else {
        $("html,body").scrollTop(0);

        const products = data.data;
        let randomizedIndex = parseInt(Math.random() * products.length);
        let product = products[randomizedIndex];

        if (getCookie("last-item").length <= 0) {
          setCookie("last-item", "[]");
        }

        const lastItem = JSON.parse(getCookie("last-item"));

        while (lastItem.includes(product.sku_id.toString())) {
          randomizedIndex = parseInt(Math.random() * products.length);
          product = products[randomizedIndex];
        }

        if (lastItem.length >= 40) {
          lastItem.shift();
        }

        lastItem.push(product.sku_id.toString());
        setCookie("last-item", JSON.stringify(lastItem));

        if (getCookie("last-title").length <= 0) {
          setCookie("last-title", "[]");
        }

        const lastTitle = JSON.parse(getCookie("last-title"));

        while (lastTitle.includes(product.name.toLowerCase())) {
          randomizedIndex = parseInt(Math.random() * products.length);
          product = products[randomizedIndex];
        }

        if (lastTitle.length >= 40) {
          lastTitle.shift();
        }

        lastTitle.push(product.name.toLowerCase());
        setCookie("last-title", JSON.stringify(lastTitle));

        $("#product-image img").attr("src", product.images.large_urls[0]);
        $("#product-image img").attr("alt", product.name);

        $("#product-image a").attr("href", product.url);

        $("#product-image a").attr(
          "onclick",
          "gtag('event', 'click', { 'event_category': 'cta', 'event_label': 'Product Image' });"
        );

        $("#product-title a").attr("href", product.url);
        $("#product-title a").text(product.name);

        $("#product-title a").attr(
          "onclick",
          "gtag('event', 'click', { 'event_category': 'cta', 'event_label': 'Product Title' });"
        );

        $("#product-price").text(
          "Rp " + product.price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")
        );

        $("#product-footer a").attr(
          "href",
          "https://bl.id/bayar/" + product.sku_id.toString(36)
        );

        $("#product-footer a").attr(
          "onclick",
          "gtag('event', 'click', { 'event_category': 'cta', 'event_label': 'Buy Now' });"
        );

        gtag("event", "load", {
          event_category: "pageview",
          event_label: "Get Product"
        });

        console.log(`Collected Products Length : ${products.length}`);
        console.log(`Total Products Length : ${data.meta.total}`);
        console.log(`Offset Products : ${offset}`);
        console.log(`Random Index : ${randomizedIndex}`);
      }
    }
  });
}

var tryAttemp = 1;
function getToken() {
  $.ajax({
    crossDomain: true,
    url:
      location.protocol +
      "//cors-anywhere.herokuapp.com/" +
      location.protocol +
      "//m.bukalapak.com",
    success: function(data) {
      const token = data.split('access_token:"')[1].split('"')[0];

      if (token) {
        setCookie("token", token);

        getCategories(token);
        getProducts(token);
      } else if (tryAttemp <= 3) {
        tryAttemp += 1;
        getToken();
      }
    }
  });
}

if (!getCookie("token") || getCookie("token").length <= 0) {
  getToken();
} else {
  getCategories(getCookie("token"));
  getProducts(getCookie("token"));
}
