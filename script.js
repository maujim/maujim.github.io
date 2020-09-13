function set_size_of_main_area() {
    var top = document.getElementById("top");
    var position_info = element.getBoundingClientRect();
    var top_height = position_info.height;
    // var top_width = position_info.width;

    var bottom = document.getElementById("bottom");
    var position_info = element.getBoundingClientRect();
    var bottom_height = position_info.height;
    // var bottom_width = position_info.width;

    var content = document.getElementById("page--home").style;

    content.top = top_height + 12 + 'px';
    content.bottom = bottom_height + 12 + 'px';
    // https://stackoverflow.com/questions/20162333/javascript-change-css-top-property
    // https://www.geeksforgeeks.org/how-to-run-a-function-when-the-page-is-loaded-in-javascript/
}