var ocargo = ocargo || {};

ocargo.messages = {
	nofuel : "You ran out of fuel! Try to find a shorter path to the destination.",
	tryagain : "Click 'Clear Incorrect' to remove the incorrect blocks and try again!",
	tryagainbutton: '<br><br> <button onclick="document.getElementById(' + "'close-modal'" +
		').click()">Try again</button>',
	xcorrect : function(x){
		return "Your first " + x + " execution steps were right. ";
	},
	nextLevelButton: function(level) {
		return '<button onclick="window.location.href=' + "'/game/" + level + "'" + 
			'">Next Level</button>';
	},
	lastLevel: "Congratulations, that's all we've got for you for now! <br>" +
		"Wny not try creating your own road? <br><br> <button onclick=" +
		'"window.location.href=' + "'/game/level_editor'" + 
		'"">Create your own map!</button> </center>' + '<button onclick="window.location.href=' +
		"'/home/'" + '"">Home</button>',
}