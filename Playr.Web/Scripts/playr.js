﻿var playr = {
    timer: undefined,

    pad: function (number, width) {
        width -= number.toString().length;
        if (width > 0) {
            return new Array(width + (/\./.test(number) ? 2 : 1)).join('0') + number;
        }
        return number + "";
    },

    ConvetToMinSec: function (secs) {
        var hours = Math.floor(secs / (60 * 60));

        var divisor_for_minutes = secs % (60 * 60);
        var minutes = Math.floor(divisor_for_minutes / 60);

        var divisor_for_seconds = divisor_for_minutes % 60;
        var seconds = Math.ceil(divisor_for_seconds);

        return playr.pad(minutes, 2) + ":" + playr.pad(seconds, 2);
    },

    Song: function (data) {
        var self = this;
        self.Id = ko.observable(data.Id);
        self.Artist = ko.observable(data.Artist);
        self.Album = ko.observable(data.Album);
        self.Title = ko.observable(data.Title);
        self.Rating = ko.observable(data.Rating);
        self.ArtworkUrl = ko.observable(data.ArtworkUrl);
        self.IsFavorite = ko.observable(data.IsFavorite);
        self.SongDownloadUrl = ko.observable(data.DownloadUrl);
        self.AlbumDownloadUrl = ko.observable(data.AlbumDownloadUrl);
        self.Duration = ko.observable(data.Duration);
        self.Poisition = ko.observable(data.Poisition);

        self.TimeRemaining = ko.computed(function () {
            var time = self.Duration() - self.Poisition();
            return playr.ConvetToMinSec(time >= 1 ? time : 0);
        });

        self.Favorite = function () {
            var url = "/songs/" + self.Id() + "/favorite";
            if (self.IsFavorite()) {
                $.ajax({url: url, type: "DELETE"  });
            }
            else {
                $.ajax({ url: url, type: "PUT" });
            }
            self.IsFavorite(!self.IsFavorite());
        };
    },

    initMainPage: function(data, hubUrl) {
        function PageViewModel(djInfo) {
            var self = this;
            self.CurrentTrack = ko.observable(new playr.Song(djInfo.CurrentTrack));
            self.History = ko.observableArray();
            self.Queue = ko.observableArray();

            $.each(djInfo.History, function (idx, item) {
                self.History.push(new playr.Song(item));
            });
            $.each(djInfo.Queue, function (idx, item) {
                self.Queue.push(new playr.Song(item));
            });

        }

        function tick() {
            viewModel.CurrentTrack().Poisition(viewModel.CurrentTrack().Poisition() + 1);
            playr.timer = setTimeout(tick, 1000);
        };

        var viewModel = new PageViewModel(data),
            hub = $.connection.playr, 
            timer;

        ko.applyBindings(viewModel);

        tick();

        hub.DjInfoUpdated = function () {
            clearTimeout(playr.timer);
            $.getJSON("/home/GetQueue", function (data) {
                viewModel.CurrentTrack(new playr.Song(data.CurrentTrack));
                viewModel.History.removeAll();
                viewModel.Queue.removeAll();
                // TODO: This is pretty bad each push redraws, fix this...
                $.each(data.History, function (idx, item) {
                    viewModel.History.push(new playr.Song(item));
                });
                $.each(data.Queue, function (idx, item) {
                    viewModel.Queue.push(new playr.Song(item));
                });
            });
            tick();
        };

        $.connection.hub.url = hubUrl;
        $.connection.hub.start();
    }
};

// General Setup for everything
$(function () {
    $("#commandBar").hover(function () {
        $(this).find(".expanded").slideDown();
    }, function () {
        $(this).find(".expanded").slideUp();
    });




});
