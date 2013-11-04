$(function () {
    
    var createNewTodo = function(newText) {
        var $newDiv = $("#templates .todo-item").clone();
        $newDiv.find("label").text(newText);
        return $newDiv;
    };

    var updateTodoCount = function (newCount) {
        var $todoList = $("#todo-list"),
            numTodos = $todoList.find("li").length - $todoList.find(".completed").length,
            $todoCount = $("#todo-count");
        $("#t-count").text(numTodos);
        var newHTML;
        if (numTodos === 1) {
            newHTML = $todoCount.html().replace(/items\s/, "item ");
        } else {
            newHTML = $todoCount.html().replace(/item\s/, "items ");
        }
        $todoCount.html(newHTML); // breaks dynajot.
    };

    var updateClearCompleted = function () {
        var $btn = $("#clear-completed"),
            completed_count = $("#todo-list .completed").length;

        if (completed_count > 0) {
            $btn.removeClass("hidden");
            $btn.text("Clear completed ("+ completed_count + ")");
        } else {
            $btn.addClass("hidden");
        }
        updateTodoCount();
    };

    $("body").on("click", "#clear-completed", function () {
        $("#todo-list .completed").remove();
        $("#clear-completed").addClass("hidden");
        updateTodoCount();
    });

    $("body").on("keyup", "#new-todo", function (evt) {
        if (evt.keyCode === 13) {
            var $todos = $("#todo-list"),
                $textBox = $('#new-todo'),
                newText = $textBox.val();
            if (newText.length > 0) {
                $todos.prepend(createNewTodo(newText));
                $textBox.val("");
                updateTodoCount();
            }
        }
    });

    $("body").on("click", "#todo-list .toggle", function () {
        var $parent = $(this).parents("li");
        $parent.toggleClass("completed");
        updateClearCompleted();
    });

    $("body").on("click", "#todo-list .destroy", function() {
        $(this).parents("li").remove();
        updateTodoCount();
    });
    
    $("body").on("click", "#filters a", function (e) {
        e.preventDefault();
        var $filters = $("#filters"),
            $todos = $("#todo-list"),
            $this = $(this),
            selectedFilter = $this.data("filter-name");
            
        $filters.find("a").removeClass("selected");
        $this.addClass("selected");
         
        // $todos.find("li").removeClass("hidden");
        // if (selectedFilter === "active") {
        //     $todos.find("li").filter(function() {
        //         return $(this).find('input:checked').length > 0;
        //     }).addClass('hidden');
        // } else if (selectedFilter === "completed") {
        //     $todos.find("li").filter(function() {
        //         return $(this).find('input:checked').length === 0;
        //     }).addClass('hidden');
        // } else {}

        // updateTodoCount();
    });

});