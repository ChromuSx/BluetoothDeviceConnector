param(
    [Parameter(Mandatory = $true)]
    [AllowEmptyString()]
    [string]$Message,

    [switch]$ValidateOnly
)

Add-Type -AssemblyName PresentationFramework

$window = New-Object System.Windows.Window
$window.Title = 'Bluetooth Device Connector - Diagnostic'
$window.Width = 720
$window.Height = 430
$window.MinWidth = 520
$window.MinHeight = 300
$window.WindowStartupLocation = 'CenterScreen'
$window.ResizeMode = 'CanResizeWithGrip'
$window.Topmost = $true

$root = New-Object System.Windows.Controls.Grid
$root.Margin = 16

$headingRow = New-Object System.Windows.Controls.RowDefinition
$headingRow.Height = 'Auto'
$detailsRow = New-Object System.Windows.Controls.RowDefinition
$detailsRow.Height = '*'
$buttonsRow = New-Object System.Windows.Controls.RowDefinition
$buttonsRow.Height = 'Auto'
$root.RowDefinitions.Add($headingRow)
$root.RowDefinitions.Add($detailsRow)
$root.RowDefinitions.Add($buttonsRow)

$heading = New-Object System.Windows.Controls.TextBlock
$heading.Text = 'The Bluetooth action failed'
$heading.FontSize = 18
$heading.FontWeight = 'SemiBold'
$heading.Margin = '0,0,0,12'
[System.Windows.Controls.Grid]::SetRow($heading, 0)
$root.Children.Add($heading) | Out-Null

$details = New-Object System.Windows.Controls.TextBox
$details.Text = $Message
$details.IsReadOnly = $true
$details.AcceptsReturn = $true
$details.TextWrapping = 'Wrap'
$details.VerticalScrollBarVisibility = 'Auto'
$details.HorizontalScrollBarVisibility = 'Auto'
$details.FontFamily = 'Consolas'
$details.FontSize = 13
$details.Padding = 10
[System.Windows.Controls.Grid]::SetRow($details, 1)
$root.Children.Add($details) | Out-Null

$buttons = New-Object System.Windows.Controls.StackPanel
$buttons.Orientation = 'Horizontal'
$buttons.HorizontalAlignment = 'Right'
$buttons.Margin = '0,12,0,0'
[System.Windows.Controls.Grid]::SetRow($buttons, 2)

$copyButton = New-Object System.Windows.Controls.Button
$copyButton.Content = 'Copy diagnostic'
$copyButton.MinWidth = 130
$copyButton.Padding = '12,7'
$copyButton.Margin = '0,0,8,0'
$copyButton.Add_Click({
    [System.Windows.Clipboard]::SetText($Message)
    $copyButton.Content = 'Copied'
})
$buttons.Children.Add($copyButton) | Out-Null

$closeButton = New-Object System.Windows.Controls.Button
$closeButton.Content = 'Close'
$closeButton.MinWidth = 90
$closeButton.Padding = '12,7'
$closeButton.IsDefault = $true
$closeButton.Add_Click({ $window.Close() })
$buttons.Children.Add($closeButton) | Out-Null

$root.Children.Add($buttons) | Out-Null
$window.Content = $root
$window.Add_ContentRendered({ $details.Focus() })

if ($ValidateOnly) {
    Write-Output 'Diagnostic dialog initialized successfully.'
    exit 0
}

$window.ShowDialog() | Out-Null
