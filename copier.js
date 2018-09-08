var Helper = Helper || {
    clean: function(elem) {
        $(elem).removeAttr("style").removeAttr("class")
        $(elem).find("div,p,ul,li,a,img,ol").removeAttr("style").removeAttr("class")
        return elem
    }
}

var LinkCopier = LinkCopier || {
    id: 'link-handler-container',
    off: true,
    target_selector: 'a',
    links: [],
    filtered_links: [],
    vue_app: null,

    handle: function(elem) {
        this.current_zoom = 100;
        $("body").addClass("link-handler-container")
        this.reading = true
    },

    send_message: function() {
        chrome.extension.sendMessage({
            is_off: this.off
        }, function(response) {
            // console.log(response);
        });
    },

    toggle: function() {
        LinkCopier.off = !LinkCopier.off;
        LinkCopier.send_message();
        if(this.off) {
            LinkCopier.turn_off()
        } else {
            LinkCopier.init_events()
        }
    },

    close: function() {
        LinkCopier.reading = false
        $("#" + LinkCopier.id).remove();
        $("body").removeClass("link-handler-container")
    },

    turn_off: function() {
        LinkCopier.off = true;
        LinkCopier.send_message();
        LinkCopier.close();
    },

    filter: function() {
        var key = $("#link-handler-filter").val()

        if(key.length == 0) {
            LinkCopier.filtered_links = LinkCopier.links
            LinkCopier.render()
            return
        }

        keys = key.toLowerCase().split(" ")

        var tmp_filtered_links = LinkCopier.links;
        $(keys).each(function(k, key) {
          LinkCopier.filtered_links = []
          $(tmp_filtered_links).each(function(index, link) {
            if(
                link.text.toLowerCase().indexOf(key) != -1 ||
                link.url.toLowerCase().indexOf(key) != -1
            ) {
                LinkCopier.filtered_links.push(link)
            }
          })
          tmp_filtered_links = LinkCopier.filtered_links
        })

        LinkCopier.render()
    },

    copy_text: function(text) {
        var backup_text = $("#copy-target").val()
        $("#copy-target").val(text)
        $('.copy-action').trigger("click")
        setTimeout(function() {
            $("#copy-target").val(backup_text)
        }, 500);
    },

    copied_tip: function() {
        var $t = $(".copy-action").addClass("copied")
        $t.text("copied!")
        setTimeout(function() {
            $t.text("copy").removeClass("copied")
        }, 2000);
    },

    init_events: function() {
        //addClass to body
        $("body").addClass("link-handler-container")
        $("body").keyup(function(e){
            if (e.keyCode == 27) {
                LinkCopier.turn_off()
            }
        })

        // init selector
        var selector = "div,ul,ol,section";
        $("body").on("mouseenter", selector, function(e){
          e.stopPropagation()
          if ($(this).parents(".link-handler-box").length > 0) {
            return false;
          }
          $(".lc-over").removeClass("lc-over");
          $(this).addClass("lc-over");
        }).on("mouseleave", selector, function(e){
          e.stopPropagation()
          $(this).removeClass("lc-over");
        }).on("click", selector, function(e){
          e.stopPropagation();
          if ($(this).parents(".link-handler-box").length == 0) {
            $(".lc-selected").removeClass("lc-selected");
            $(this).addClass("lc-selected");
            LinkCopier.pre_render();
          }
        })


        this.make_box()
        setTimeout(function() {
            $("#link-handler-filter").focus()
            $(".link-handler-box .filter-key").click(function(){
                var key = $(this).text()
                $("#link-handler-filter").val(key).focus()
                LinkCopier.filter()
            })
            var clipboard = new Clipboard('.copy-action', {
                text: function(trigger) {
                    return $("#copy-target").val();
                }
            });
            clipboard.on('success', function(e) {
                LinkCopier.copied_tip()
            });

            var link_copier_app = new Vue({
                el: '#link-copier-app',
                data: {
                    links: LinkCopier.links
                },
                methods: {
                    checking: function() {
                        this.update_links()
                    },
                    update_links: function() {
                        var texts = [], texts2 = [];
                        $.each(this.links, function(index, link){
                            if (link.checked) {
                                texts.push(link.url)
                            }
                            texts2.push(link.url)
                        })
                        if (texts.length == 0) {
                            texts = texts2
                        }
                        $("#copy-target").val(texts.join("\n"))
                    }
                },
                watch: {
                    links: function(new_links) {
                      $(".counter").html(new_links.length);
                      $.each(new_links, function(index, link){
                          link.checked = false
                      })
                      this.update_links()
                    }
                }
            })
            LinkCopier.vue_app = link_copier_app
            LinkCopier.vue_app.links = LinkCopier.filtered_links


        }, 100);

        $("#link-handler-filter").keyup(function(e) {
            var key = $(this).val()
            LinkCopier.filter()
        })
        LinkCopier.pre_render()
    },

    pre_render: function() {
      $("#link-handler-filter").val("");
      LinkCopier.links = []
        //get links
        $links = $("a")
        if ($(".lc-selected").length > 0) {
          $links = $(".lc-selected a")
        }
        $links.each(function() {
            var $link = $(this)
            var text = $.trim($link.text().replace(/\s+/gi, " "))
            var url = $link.attr("href")
            if(
                text != undefined &&
                url != undefined &&
                text.length > 0 &&
                url.length > 10
            ) {
                LinkCopier.links.push({
                    text: text,
                    checked: false,
                    url: url
                })
            }

        })
        LinkCopier.filtered_links = LinkCopier.links
        LinkCopier.render()
    },

    render: function() {
        if (LinkCopier.vue_app) {
            LinkCopier.vue_app.links = LinkCopier.filtered_links
            return
        }

        var $container = $("#link-handler-link-container")
        var $filter = $("#link-handler-filter")
        var texts = []
        var htmls = [
            '<div id="link-copier-app"><ul>',
            '<li v-for="link in links" class="link-handler-item"><input v-model="link.checked" @click="checking" style="width:15px;height:15px;" type="checkbox" ><span class="title" selectable="false">{{link.text}}:</span> <br> <span class="url">{{link.url}}</span></li>',
            '</ul></div>'
        ]

        $container.html(htmls.join(""))
    },

    //private
    make_box: function() {
        var keys = ["ed2k", "magnet", "thunder", "qqdl"]
        var keys_htmls = []
        $(keys).each(function(index, key){
            keys_htmls.push('<span class="filter-key">'+key+'</span>')
        })
        var htmls = [
            '<div style="display:none"><textarea id="copy-target"></textarea></div>',
            '<div id="' + LinkCopier.id + '" class="link-handler-box">',
            '<div class="filter-keys">',
                keys_htmls.join(""),
                '<span class="copy-action" data-clipboard-target="#copy-target">copy</span>',
                '<span class="counter"></span>',
            '</div>',
            '<div><input type="text" id="link-handler-filter" ></div>',
            '<div id="link-handler-link-container"></div>',
            '</div>'
        ]

        $("body").append(htmls.join(""))
    }

}

LinkCopier.toggle();
