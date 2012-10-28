(function() {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame =
          window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); },
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };

    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
}());

(function() {

  var Visualizer = function() {
    var that = {notes: {}};
    that.$canvas = $('#canvas');
    that.el = that.$canvas[0];
    that.canvas = that.el.getContext('2d');

    var drawNote = function(note, velo) {

      var xRel = (note - 10) / 60.0;
      var yRel = 1.0 - velo;
      console.log('draw', xRel, yRel, that.$canvas[0].width);
      that.canvas.fillStyle = "#ffffff";
      that.canvas.fillRect(xRel*that.el.width, yRel*that.el.height, 50,50);


    };

    var clear = function() {
      that.canvas.clearRect(0,0,that.el.width, that.el.height);
    }

    var draw = function() {
      clear();
      _(that.notes).each(function(velo, note) {
        drawNote(note, velo);
      });
      requestAnimationFrame(draw);
    };

    that.noteon = function(note, velo) {
      that.notes[note] = velo;
    };
    that.noteoff = function(note, velo) {
      delete that.notes[note];
    };
    draw();
    return that;
  };



  $(function() {

    console.log('http://' + window.location.hostname + "/control")
    var socket = io.connect('http://' + window.location.host + "/control");
    var currentNotes = {};

    var SCALES = {mayor: [0,2,4,7,9], minor: [0,3,5,7,10]};
    var currentScale = 'mayor';

    var visu = new Visualizer();

    var clampToScale = function(note) {
      var oct = Math.floor(note/12);
      var noteInOct = Math.floor(note % 12);
      var pentaNoteInOct = noteInOct;
      var allowedNotes = SCALES[currentScale];
      if (allowedNotes.indexOf(noteInOct) == -1) {
        var idx = _(allowedNotes).sortedIndex(noteInOct);
        pentaNoteInOct = allowedNotes[Math.min(idx, allowedNotes.length - 1)];
      }
      return (oct * 12) + pentaNoteInOct;
    };

    var addNote = function(id, target, x, y) {
      // return if note event is active anyway (repeated touch symbol)
      if(currentNotes[id]) return;

      $el = $('.note-input');
      var off = $el.offset();
      var x = x - off.left;
      var y = y - off.top;

      x = 1.0 * (x / $el.width());
      y = 1.0 * (y / $el.height());

      var note = clampToScale(Math.floor(60 * x)+10);
      currentNotes[id] = note
      visu.noteon(note, 1.0-y);
      socket.emit('noteon', { note: note, velocity: 1.0-y });
      console.log("sent note", note, 1.0-y);
    };

    var removeNote = function(id) {
      if(!currentNotes[id]) return;
      console.log('noteoff', id, currentNotes[id]);
      visu.noteoff(currentNotes[id]);
      socket.emit('noteoff', { note: currentNotes[id] });
      delete currentNotes[id];
    }



    $('.note-input').on('touchstart', function(e) {
      e.preventDefault();
      console.log("touchstart", e.originalEvent.touches);
      _(e.originalEvent.touches).each(function(touch) {
        addNote(touch.identifier, this, touch.pageX, touch.pageY);
      });
    }).on('touchend', function(e) {
      e.preventDefault();
      console.log("touchend", e.originalEvent.touches);
      var touchIds = _(e.originalEvent.touches).map(function(touch) {
        return ""+touch.identifier;
      });
      var noteIds = _(currentNotes).keys();
      var diff = _(noteIds).difference(touchIds)
      console.log(touchIds, noteIds, diff);
      _(diff).each(function(id) {
        removeNote(id);
      });


      // currentNotes = _(currentNotes).filter(function(note, id, list) {
      //   return _(ids).indexOf(id) > -1
      // });
    }).mousedown(function(e) {
      addNote('mouse', this, e.pageX, e.pageY);
    }).mouseup(function(e) {
      removeNote('mouse');
    });

    $('input[name="scale"]').click(function(e) {
      var $el = $(this);
      currentScale = $el.val();
    })

    $('#panic').click(function() {
      socket.emit('panic', {});
    });

    socket.on('news', function (data) {
      if (data.clientCount) {
        $('.status-display').html("" + data.clientCount + " clients connected.");
      }
    });
  });

}());
