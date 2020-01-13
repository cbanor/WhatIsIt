namespace Shotgun.Ui {
    export class Bootstrap {
        /**创建一个alert对话框 */
        static createAlert(styleName: string, iClose?: boolean): JQuery<HTMLElement> {
            var div = $("<div></div>");
            div.addClass("alert");
            div.addClass("alert-".concat(styleName))
            if (!iClose) return div;
            div.addClass("alert-dismissable");
            var a=$("<a href=\"#\" class=\"close\" data-dismiss=\"alert\">&times;</a>");
            div.append(a);
            return div;
        }
    }
}