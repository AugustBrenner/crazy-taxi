Crazy Taxi
========
Universal Javascript easy and seamless

----------

Crazy taxi is based on Mithril.js and uses hyperscript syntax (pure JS) for it's templates.  Dead simple backend rendering.

	var ct = require('crazy-taxi’)

	var component = ct.compile('./component.js’)
	
	var compiledHTMLString = component({name: ‘Joe’})



The rendering of each component is independent, and functions independently on the front end.  Any attributes you pass into the compiled function are pre-rendered and hydrated automatically on the client!

	`<head>
		<title>Craaaaazy Taaaaxi</title>
	</head>
	
	<body>
	 	<h1>
			${  component_one({name: ‘Joe’})  }
			${  component_one({name: ‘Schmoe’})  }
		<h2>
		
		<p>
			${  component_two({title: ‘Programmer’})  }
		</p>

		<div>
			<p>Don't be afraid to write HUUUUGE components!</p>
			${  HUGE_COMPONENT_with_lots_of_children()  }
		</div>
	</body>`
