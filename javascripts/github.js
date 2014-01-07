var github = {
  showRepos: function(options) {
    this.options = options;
    this._getData();
  },
  _getData: function() {
    $.getJSON("https://api.github.com/users/"+this.options.user+"/repos?callback=?", $.proxy(this._getDataCallback, this));
  },
  _getDataCallback: function(data) {
    var repos = [];
    var exclude = [
      'mrngoitall.github.io',
      'mean',
      'hangouts-against-humanity',
      'octopress',
      '2013-Sep-HR-ML-sprint',
      'PixelPuzzle',
      'drywall',
      'angularTicTacToe'];
    if (!data || !data.data) { return; }
    for (var i = 0; i < data.data.length; i++) {
      if (this.options.skip_forks && data.data[i].fork) { continue; }
      repos.push(data.data[i]);
    }
    repos.sort(function(a, b) {
      var aDate = new Date(a.pushed_at).valueOf(),
          bDate = new Date(b.pushed_at).valueOf();

      if (aDate === bDate) { return 0; }
      return aDate > bDate ? -1 : 1;
    });
    for (var j = 0; j < repos.length; j++) {
      for (var k = 0; k < exclude.length; k++) {
        if (exclude[k] === repos[j].name || repos[j].name.indexOf('2013-08') > -1) {
          repos.splice(j--,1);
          break;
        }
      }
    }
    if (this.options.count) { repos.splice(this.options.count); }
    this._render(this.options.target, repos);
  },
  _render: function(target, repos) {
    var i = 0, fragment = '', t = $(target)[0];

    for(i = 0; i < repos.length; i++) {
      // Add this between the a tags later if you want the github logo after each repo name (gets cut off if there's a description): <img class="social_icon" src="/images/glyphicons_381_github.png" alt="github icon" title="Github"/>
      fragment += '<dt><a href="'+repos[i].html_url+'">'+repos[i].name+'</a><a rel="tooltip" href="'+repos[i].html_url+'" title="open sourced at Github"></a></dt><dd>'+(repos[i].description||'&nbsp;')+'</p></dd>';
    }
    t.innerHTML = fragment;
  }
};