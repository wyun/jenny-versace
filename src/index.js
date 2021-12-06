import $ from 'jquery';

$(function () {
  $.get('example.txt', function (data) {
    $('#original').val(data);
  });
  $.get('fiber.tsv', function (data) {
    $('#fiberMap').val(data);
  });
  $.get('material.tsv', function (data) {
    $('#matMap').val(data);
  });
  function copy() {
    var target = document.getElementById('result');
    var range, select;
    if (document.createRange) {
      range = document.createRange();
      range.selectNode(target);
      select = window.getSelection();
      select.removeAllRanges();
      select.addRange(range);
      document.execCommand('copy');
      select.removeAllRanges();
    } else {
      range = document.body.createTextRange();
      range.moveToElementText(target);
      range.select();
      document.execCommand('copy');
    }
    alert('Translation is copied to clipboard');
  }
  $('#clearTxt').click(function () {
    $('#original').val('');
  });
  $('#copy').click(copy);
  $('#run').click(function () {
    var fiberMap = {};
    var matMap = {};
    var errors = {};
    var fText = $('#fiberMap').val();
    $(fText.split('\n')).each(function (i, d) {
      var mp = d.split(/\t|:\s*/);
      if (fiberMap[mp[0]]) {
        errors['Duplicate fiber mapping: ' + mp[0]] = 1;
      }
      if (mp[0]) {
        fiberMap[mp[0]] = mp[1];
      }
    });
    var mText = $('#matMap').val();
    var matArr = [];
    var prevMat = '';
    var invalidMat = {};
    $(mText.split('\n')).each(function (i, d) {
      var mp = d.split(/\t|:\s*/);
      if (matMap[mp[0].toUpperCase()]) {
        errors['Duplicate material mapping: ' + mp[0]] = 1;
      }
      if (mp[0]) {
        matMap[mp[0].toUpperCase()] = mp[1];
        if (mp[1] !== prevMat) {
          matArr.push(mp[1]);
        }
        prevMat = mp[1];
      }
    });

    $('.error').html('').hide();
    var orig = $('#original').val();
    var arr = orig.split('\n');
    var res = '';

    var titleRE = /(\d\.)?([^\d]*?)( \d)?$/;
    $(arr).each(function (i, d) {
      var items = d.split(/\s*;\s*/);
      var sect = [];
      var lineObj = {};
      $(items).each(function (j, it) {
        var f = it.split(':');
        // f[0] get material section
        // f[1]: comma seperated values
        var comptext = f[0];
        var mat = f[0];
        var nn;
        if (comptext.length > 0 && (nn = titleRE.exec(f[0])) !== null) {
          if (nn.index === titleRE.lastIndex) {
            titleRE.lastIndex++;
          }
          if (matMap[nn[2].toUpperCase()]) {
            comptext = (nn[1] || '') + matMap[nn[2].toUpperCase()] + (nn[3] || '');
            mat = matMap[nn[2].toUpperCase()];
          } else {
            comptext = "<span class='red'>" + f[0] + '</span>';
            errors['Material map missing: ' + nn[2]] = 1;
            if (!invalidMat[nn[2]]) {
              matArr.push(nn[2]);
              invalidMat[nn[2]] = 1;
            }
          }
        }
        if (!lineObj[mat]) {
          lineObj[mat] = [];
        }
        var comp = [];
        var regex = /((\d+)%) ([A-Z]+)/gm;
        var totalPct = 0;
        while ((m = regex.exec(f[1])) !== null) {
          if (m.index === regex.lastIndex) {
            regex.lastIndex++;
          }
          totalPct += parseInt(m[2]);
          if (fiberMap[m[3]]) {
            m[3] = fiberMap[m[3]];
            if (m[1] === '100%' && m[3].search('革') !== -1) {
              m[1] = '';
            }
          } else {
            errors['Fiber map missing: ' + m[3]] = 1;
            m[3] = "<span class='red'>" + m[3] + '</span>';
          }
          comp.push((m[1] ? m[1] : '') + m[3]);
          //lineObj[mat].push((m[1] ? m[1] + ' ' : '') + m[2]);
        }
        if (comptext.length > 0) {
          if (totalPct !== 100 && totalPct !== 0) {
            comp.push("<span class='blue'>[Error: total is " + totalPct + '%]</span>');
            errors['Total % is not equal to 100%.'] = 1;
          }
          lineObj[mat].push(comp);
          comptext += ':' + comp.join(' ');
        } else {
          comptext = '';
        }
        sect.push(comptext);
      });
      var newOrder = [];
      $.each(matArr, function (i, a) {
        if (lineObj[a]) {
          var ct = 1;
          var prevA = '';
          var prevTxt = '';
          var addLen = lineObj[a].length > 1 ? 1 : 0;
          $.each(lineObj[a], function (j, b) {
            if (b.length > 1) {
              b = b.sort(function (x, y) {
                return parseInt(y) - parseInt(x);
              });
            }
            var txt = b.join(' ');
            /*
              if (prevA === a && prevTxt === txt) {
                return;
              } 
              */
            newOrder.push(
              (invalidMat[a] ? '<span class="red">' + a + '</span>' : a) +
                (addLen ? ct : '') +
                ': ' +
                txt
            );
            prevA = a;
            prevTxt = txt;
            ct++;
          });
        }
      });
      res += newOrder.join('; ') + '\n';
    });
    $('#result').html(res).show();
    $('#copy,#transtitle').show();
    if (Object.keys(errors).length) {
      $('.error').append('<h3>Error</h3>').show();
      $.each(errors, function (key, value) {
        $('.error').append('<div class="red">' + key + '</div>');
      });
    }
    $('#original').height($('#result').height());
  });
});
