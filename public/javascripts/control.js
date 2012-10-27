(function() {
  $(function() {
    console.log('http://' + window.location.hostname + "/control")
    var socket = io.connect('http://' + window.location.host + "/control");
    var currentNotes = {};

    var pentatonics = {mayor: [0,2,4,7,9]};

    var clampToPentatonics = function(note, scale) {
      var oct = Math.floor(note/12);
      var noteInOct = Math.floor(note % 12);
      var pentaNoteInOct = noteInOct;
      var allowedNotes = pentatonics[scale];
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

      var note = clampToPentatonics(Math.floor(60 * x)+10, 'mayor');
      currentNotes[id] = note
      socket.emit('noteon', { note: note, velocity: 1.0-y });
      console.log("sent note", note, 1.0-y);
    };

    var removeNote = function(id) {
      if(!currentNotes[id]) return;
      console.log('noteoff', id, currentNotes[id]);
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
