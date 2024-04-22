const express             = require('express'),
      MicropubController  = express.Router(),
      config              = require(__dirname + '/../config/app')[process.env.NODE_ENV || 'development'],
      showdown            = require('showdown'),
      converter           = new showdown.Converter({metadata: true, emoji: true, ghCodeBlocks: true}),
      fs                  = require('fs');

MicropubController.route('/?')
  // Respond to iA Writer's request.
  // Tell them all went well
  .get((req, res, next) => {
    res.status(200).json({});
  })
  // Receive the content from iA Writer
  .post((req, res, next) => {
    if (!req.headers.authorization || req.headers.authorization != 'Bearer ' + config.micropub.token) {
      console.log('AUTH ERROR');
      res.status(401).json({});
      // res.redirect(201, 'https://thedarph.com/log');
    } else {
      const title   = req.body.properties.name[0];
      const content = req.body.properties.content[0];

      const date = new Date();
      const filename = [
        date.toISOString().split('T')[0], // the date
        title.replace(/[W]+/g,"-") // the slug
      ].join("-")
      
      var fileContent = []
      // If we've written a post without frontmatter, insert default fontmatter
      // this allows us to override the fontmatter in iA Writer if we want, but
      // we can also just throw out a quick article without worrying about this.
      if (!content.includes("---")) {
        fileContent.push("---")
        fileContent.push('date: ' + date.toISOString())
        fileContent.push('title: ' + title)
        fileContent.push('category: note')
        fileContent.push('---')
      }
      fileContent.push(content);
      fileContent.join('\n');

      // Write file to server as source/2011-10-18-middleman.html.markdown
      // where 'source' is in the Middleman working directory
      // Then set some way to run the middleman build script
      // var fileWritePath = '/srv/www/darph/log/entries/';
      var fileWritePath = '/srv/www/darph/public/log/';
      if (process.env.DEVELOPMENT) {
        // Put test path for files here
        fileWritePath = 'xxx';
      }

      try {
        // DEAL WITH INDEX PAGE LINKS
        
        // Read the template file
        let templateFile = fs.readFileSync('/srv/www/darph/public/log/template.html');
        
        // Generate HTML from Markdown
        let document = converter.makeHtml(fileContent);
        let metadata = converter.getMetadata(fileContent);
        
        // Insert Markdown transpiled string into the document
        fileContent = templateFile.replace('<!-- REPLACE_WITH_CONTENT -->', document);
        
        // Write the file
        fs.writeFileSync(fileWritePath + filename.replace(/\s/g, '-') + '.html', fileContent); 
        
        // Update the index page
        // ---------------------
        // Generate HTML for the latest entry
        let logIndex = fs.readFileSync('/srv/www/darph/public/log/index.html');
        let listEntry = '<h2><a href=/log/"' + filename.replace(/\s/g, '-') + '.html' + '</a></h2><p>' + metadata.date + '</p><hr /> <!-- REPLACE_WITH_CONTENT -->';
        
        // Overwrite the index page
        fs.writeFileSync('/srv/www/darph/public/log/index.html', logIndex.replace('<!-- REPLACE_WITH_CONTENT -->'));
        
        res.redirect(201, 'https://thedarph.com/log/');
      } catch(e) {
        console.log(e);
        res.redirect(201, 'https://thedarph.com/log/');
      }
    }
  })

module.exports = MicropubController;
