(function() {

  var Synth = function() {
    var that = { notes: /* 0 */ [ 16.35,    17.32,    18.35,    19.45,    20.6,     21.83,    23.12,    24.5,     25.96,    27.5,  29.14,    30.87,
                     /* 1 */   32.7,     34.65,    36.71,    38.89,    41.2,     43.65,    46.25,    49,       51.91,    55,    58.27,    61.74,
                     /* 2 */   65.41,    69.3,     73.42,    77.78,    82.41,    87.31,    92.5,     98,       103.83,   110,   116.54,   123.47,
                     /* 3 */   130.81,   138.59,   146.83,   155.56,   164.81,   174.61,   185,      196,      207.65,   220,   233.08,   246.94,
                     /* 4 */   261.63,   277.18,   293.66,   311.13,   329.63,   349.23,   369.99,   392,      415.3,    440,   466.16,   493.88,
                     /* 5 */   523.25,   554.37,   587.33,   622.25,   659.26,   698.46,   739.99,   783.99,   830.61,   880,   932.33,   987.77,
                     /* 6 */   1046.5,   1108.73,  1174.66,  1244.51,  1318.51,  1396.91,  1479.98,  1567.98,  1661.22,  1760,  1864.66,  1975.53,
                     /* 7 */   2093,     2217.46,  2349.32,  2489.02,  2637.02,  2793.83,  2959.96,  3135.96,  3322.44,  3520,  3729.31,  3951.07,
                     /* 8 */   4186.01,  4434.92,  4698.64,  4978 ],
      attack: 0.5, // in secs
      decay: 1.2, // in secs
      detune: 4 // in cent
    };

    that.getNoteFreq = function(note) {
      return that.notes[Math.max(0,Math.min(note, 99))];
    };

    that.panic = function() {
      console.log("OMG PANIK!");
      if (that.osc1.playbackState = that.osc1.PLAYING_STATE) that.osc1.noteOff(0);
      if (that.osc2.playbackState = that.osc2.PLAYING_STATE) that.osc2.noteOff(0);
      that.env.gain.value = 0.0;
    }

    that.noteon = function(note, velo) {
      if (that.osc1 && that.osc2) {
        if (that.osc1.playbackState === that.osc1.PLAYING_STATE) {
          return false;
        }
        that.osc1.disconnect();
        that.osc2.disconnect();
      }
      console.log('note on', note);
      var freq = that.getNoteFreq(note);

      that.filter.frequency.value = 100.0 + (1000.0 * velo);
      that.osc1 = that.ca.createOscillator();
      that.osc1.type = 2;
      that.osc1.connect(that.filter);
      that.osc1.frequency.value = freq;
      that.osc1.detune.value = that.detune * -1;
      that.osc2 = that.ca.createOscillator();
      that.osc2.type = 2;
      that.osc2.connect(that.filter);
      that.osc2.frequency.value = that.notes[note];
      that.osc2.detune.value = that.detune;
      that.env.gain.setValueAtTime(0.0, that.ca.currentTime);
      that.env.gain.linearRampToValueAtTime(1.0, that.ca.currentTime + that.attack);
      that.osc1.noteOn(0);
      that.osc2.noteOn(0);
      return true;
    };
    that.noteoff = function() {
      that.env.gain.setValueAtTime(1.0, that.ca.currentTime);
      that.env.gain.linearRampToValueAtTime(0.0, that.ca.currentTime + that.decay);
      that.osc1.noteOff(that.ca.currentTime + that.decay);
      that.osc2.noteOff(that.ca.currentTime + that.decay);
    };
    that.ca = new webkitAudioContext();
    that.env = that.ca.createGainNode();
    that.mixer = that.ca.createGainNode();
    that.env.connect(that.mixer);
    that.mixer.gain.value = 0.4;
    that.mixer.connect(that.ca.destination);
    that.filter = that.ca.createBiquadFilter();
    that.filter.type = that.filter.LOWPASS;

    that.filter.Q.value = 0.8;
    that.filter.connect(that.env);


    console.log("synth initiated", that.notes.length);
    return that;

  };


  $(function() {
    console.log("init");
    var synth = Synth();
    window.synth = synth;
    var socket = io.connect('http://' + window.location.hostname + "/play");
    socket.on('connect', function (data) {
      $('.status-display').removeClass('error').html('connected to server. \\o/');
    });
    socket.on('disconnect', function (data) {
      $('.status-display').addClass('error').html('disconnected from server');
    });

    socket.on('noteon', function (data, fn) {
      fn(synth.noteon(data.note, data.velocity));

    });
    socket.on('noteoff', function (data) {
      synth.noteoff();
      console.log('note off', data);
    });

    socket.on('panic', function() {
      synth.panic();
    });
  });

}());