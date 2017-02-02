var Helper = Helper || {
    clean: function(elem) {
        $(elem).removeAttr("style").removeAttr("class")
        $(elem).find("div,p,ul,li,a,img").removeAttr("style").removeAttr("class")
        return elem
    }
}

var LinkHandler = LinkHandler || {
    id: 'link-handler-container',
    off: true,
    target_selector: 'a',
    links: [],
    filtered_links: [],

    handle: function(elem) {
        this.current_zoom = 100;
        $("body").addClass("link-handler-container")
        this.reading = true
    },

    send_message: function() {
        chrome.extension.sendMessage({
            is_off: this.off
        }, function(response) {
            console.log(response);
        });
    },

    toggle: function() {
        this.off = !this.off;
        this.send_message();
        if(this.off) {
            this.turn_off()
        } else {
            this.init_events()
        }
    },

    close: function() {
        LinkHandler.reading = false
        $("#" + LinkHandler.id).remove();
        $("body").removeClass("link-handler-container")
    },

    turn_off: function() {
        this.close();
    },

    filter: function() {
        var key = $("#link-handler-filter").val()

        if(key.length == 0) {
            LinkHandler.filtered_links = LinkHandler.links
            LinkHandler.render()
            return
        }

        LinkHandler.filtered_links = []
        key = key.toLowerCase()
        $(LinkHandler.links).each(function(index, link) {
            if(
                link.text.toLowerCase().indexOf(key) != -1 ||
                link.url.toLowerCase().indexOf(key) != -1
            ) {
                LinkHandler.filtered_links.push(link)
            }
        })

        LinkHandler.render()
    },

    init_events: function() {
        //addClass to body
        $("body").addClass("link-handler-container")
        this.make_box()
        setTimeout(function() {
            $("#link-handler-filter").focus()
            $(".link-handler-box .key").click(function(){
                var key = $(this).text()
                $("#link-handler-filter").val(key).focus()
                LinkHandler.filter()
            })
            var clipboard = new Clipboard('.copy-action', {
                text: function(trigger) {
                    return $("#copy-target").val();
                }
            });
            clipboard.on('success', function(e) {
                var $t = $(e.trigger).addClass("copied")
                var text = $t.text()
                $t.text("copied!")
                setTimeout(function() {
                    $t.text(text).removeClass("copied")
                }, 2000);

            });

        }, 100);

        $("#link-handler-filter").keyup(function(e) {
            console.log("key", e.keyCode)
            var key = $(this).val()
            LinkHandler.filter()
        })

        LinkHandler.links = []
        //get links
        $("a").each(function() {
            var $link = $(this)
            var text = $.trim($link.text().replace(/\s*/gi, " "))
            var url = $link.attr("href")
            if(
                text != undefined &&
                url != undefined &&
                text.length > 0 &&
                url.length > 10
            ) {
                console.log("text", text, url)
                LinkHandler.links.push({
                    text: text,
                    url: url
                })
            }

        })
        LinkHandler.filtered_links = LinkHandler.links
        LinkHandler.render()
    },

    render: function() {
        var $container = $("#link-handler-link-container")
        var $filter = $("#link-handler-filter")
        var texts = []
        var htmls = [
            '<ul>',
            LinkHandler.filtered_links.map(function(link, index) {
                texts.push(link.url)
                return '<li><span class="title" selectable="false">' + link.text + ":</span> <span class='url'>" + link.url + "</span></li>"
            }).join("\n"),
            '</ul>'
        ]
        $("#copy-target").val(texts.join("\n"))
        $container.html(htmls.join(""))
    },

    //private
    make_box: function() {
        var keys = ["ed2k", "magnet"]
        var keys_htmls = []
        $(keys).each(function(index, key){
            keys_htmls.push('<span class="key">'+key+'</span>')
        })
        var htmls = [
            '<div style="display:none"><textarea id="copy-target"></textarea></div>',
            '<div id="' + LinkHandler.id + '" class="link-handler-box">',
            '<div class="keys">',
                keys_htmls.join(""),
                '<span class="copy-action" data-clipboard-target="#copy-target">copy</span>',
            '</div>',
            '<div><input type="text" id="link-handler-filter" ></div>',
            '<div id="link-handler-link-container"></div>',
            '</div>'
        ]

        $("body").append(htmls.join(""))
    }

}

LinkHandler.toggle();