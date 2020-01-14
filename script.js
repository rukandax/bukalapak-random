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
    url: "https://api.bukalapak.com/categories?access_token=" + token,
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

function getProducts(token, limit = 1, offset = 0) {
  $.ajax({
    crossDomain: true,
    url:
      "https://api.bukalapak.com/products?brand=true&category_id=" +
      (queryParams.category_id || "") +
      "&original=true&condition=new&limit=" +
      limit +
      "&offset=" +
      offset +
      "&rating=4%3A5&sort=date&top_seller=true&access_token=" +
      token,
    error: function() {
      getToken();
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

        while (lastItem.includes(product.sku_id)) {
          randomizedIndex = parseInt(Math.random() * products.length);
          product = products[randomizedIndex];
        }

        if (lastItem.length >= 25) {
          lastItem.shift();
        }

        lastItem.push(product.sku_id);
        setCookie("last-item", JSON.stringify(lastItem));

        const productUrl =
          "https://bukalapak.go2cloud.org/aff_c?offer_id=15&aff_id=7049&url=" +
          encodeURIComponent(
            product.url +
              "?ho_offer_id={offer_id}&ho_trx_id={transaction_id}&affiliate_id={affiliate_id}&utm_source=hasoffers&utm_medium=affiliate&utm_campaign={offer_id}&ref={referer}"
          );

        $("#product-image").attr("style", "");
        $("#product-image img").attr("src", product.images.large_urls[0]);
        $("#product-image alt").attr("src", product.name);

        $("#product-image a").attr("href", productUrl);
        $("#product-title a").attr("href", productUrl);
        $("#product-title a").text(product.name);

        $("#product-price").text(
          "Rp " + product.price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")
        );

        $("#product-footer a").attr("href", productUrl);

        console.log(`Collected Products Length : ${products.length}`);
        console.log(`Total Products Length : ${data.meta.total}`);
        console.log(`Offset Products : ${offset}`);
        console.log(`Random Index : ${randomizedIndex}`);
      }
    }
  });
}

let tryAttemp = 1;
function getToken() {
  $.ajax({
    crossDomain: true,
    url: "https://cors-anywhere.herokuapp.com/https://m.bukalapak.com",
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
