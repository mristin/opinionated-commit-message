#!/usr/bin/env pwsh

<#
.SYNOPSIS
Runs the integration tests.
#>

function WriteExpectedGot([string]$expected, [string]$got)
{
    Write-Host "--- Expected: ---"
    Write-Host $($expected|ConvertTo-Json)
    Write-Host "--- Got: ---"
    Write-Host $($got|ConvertTo-Json)
}

function TestFailTooFewLines
{
    $got = (powershell -File OpinionatedCommitMessage.ps1 -message "Do something" -dontThrow)|Out-String

    $nl = [Environment]::NewLine
    $expected = "* Expected at least three lines (subject, empty, body), but got: 1${nl}"

    if ($got -ne $expected)
    {
        Write-Host "TestFailTooFewLines: FAILED"
        WriteExpectedGot -expected $expected -got $got
        return $false
    }

    Write-Host "TestFailTooFewLines: OK"
}

function TestFailSubjectWithNonWord
{
    $message = "ABC15 does something`n`nThis patch does something."
    $got = (powershell -File OpinionatedCommitMessage.ps1 -message $message -dontThrow)|Out-String

    $nl = [Environment]::NewLine
    $expected = (
        "* Expected the subject to start with a verb in imperative mood consisting " +
        "of letters and possibly dashes in-between, but the subject was: `"ABC15 does something`". " +
        "Please re-write the subject so that it starts with a verb in imperative mood.${nl}"
    )

    if ($got -ne $expected)
    {
        Write-Host "TestFailSubjectWithNonWord: FAILED"
        WriteExpectedGot -expected $expected -got $got
        return $false
    }

    Write-Host "TestFailSubjectWithNonWord: OK"
    return $true
}

function TestFailSubjectWithNonCapitalized
{
    $message = "do something`n`nThis patch does something."
    $got = (powershell -File OpinionatedCommitMessage.ps1 -message $message -dontThrow)|Out-String

    $nl = [Environment]::NewLine
    $expected = (
        "* The subject must start with a capitalized word, but the current first word is: `"do`". " +
        "Please capitalize to: `"Do`".${nl}"
    )

    if ($got -ne $expected)
    {
        Write-Host "TestFailSubjectWithNonCapitalized: FAILED"
        WriteExpectedGot -expected $expected -got $got
        return $false
    }

    Write-Host "TestFailSubjectWithNonCapitalized: OK"
    return $true
}

function TestFailSubjectWithNonVerb
{
    $message = "Abc does something`n`nThis patch does something."
    $got = (powershell -File OpinionatedCommitMessage.ps1 -message $message -dontThrow)|Out-String

    $nl = [Environment]::NewLine
    $expected = (
        "* The subject must start with a verb in imperative mood (according to a whitelist), " +
        "but got: `"Abc`"; if this is a false positive, consider adding the verb to -additionalVerbs or " +
        "to the file referenced by -pathToAdditionalVerbs.${nl}"
    )

    if ($got -ne $expected)
    {
        Write-Host "TestFailSubjectWithNonVerb: FAILED"
        WriteExpectedGot -expected $expected -got $got
        return $false
    }

    Write-Host "TestFailSubjectWithNonVerb: OK"
    return $true
}

function TestFailSubjectWithTrailingDot
{
    $message = "Do something.`n`nThis patch does something."
    $got = (powershell -File OpinionatedCommitMessage.ps1 -message $message -dontThrow)|Out-String

    $nl = [Environment]::NewLine
    $expected = "* The subject must not end with a dot ('.'). Please remove the trailing dot(s).${nl}"

    if ($got -ne $expected)
    {
        Write-Host "TestFailSubjectWithTrailingDot: FAILED"
        WriteExpectedGot -expected $expected -got $got
        return $false
    }
    Write-Host "TestFailSubjectWithTrailingDot: OK"
    return $true
}

function TestFailSubjectTooLong
{
    $subject = "A" * 51
    $message = "${subject}`n`nThis patch does something."
    $got = (powershell -File OpinionatedCommitMessage.ps1 -message $message -dontThrow)|Out-String

    $nl = [Environment]::NewLine
    $expected = (
        "* The subject exceeds the limit of 50 characters " +
        "(got: 51): `"AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA`". " +
        "Please shorten the subject to make it more succinct.${nl}" +
        "* The subject must start with a capitalized word, but " +
        "the current first word is: `"AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA`". " +
        "Please capitalize to: `"Aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa`".${nl}" +
        "* The subject must start with a verb in imperative mood (according to a whitelist), " +
        "but got: `"AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA`"; if this is a false positive, " +
        "consider adding the verb to -additionalVerbs or to the file referenced by -pathToAdditionalVerbs.${nl}"
    )

    if ($got -ne $expected)
    {
        Write-Host "TestFailSubjectTooLong: FAILED"
        WriteExpectedGot -expected $expected -got $got
        return $false
    }

    Write-Host "TestFailSubjectTooLong: OK"
    return $true
}

function TestFailBodyTooLong
{
    $bodyLine = "A" * 73
    $message = "Do something`n`n${bodyLine}"
    $got = (powershell -File OpinionatedCommitMessage.ps1 -message $message -dontThrow)|Out-String

    $nl = [Environment]::NewLine
    $expected = (
        "* The line 3 of the message (line 1 of the body) exceeds the limit of 72 characters. " +
        "The line contains 73 characters: `"${bodyLine}`". " +
        "Please reformat the body so that all the lines fit 72 characters.${nl}"
    )

    if ($got -ne $expected)
    {
        Write-Host "TestFailBodyTooLong: FAILED"
        WriteExpectedGot -expected $expected -got $got
        return $false
    }

    Write-Host "TestFailBodyTooLong: OK"
    return $true
}

function TestFailIdenticalFirstWordInBodyAndSubject
{
    $message = "Do something`n`nDo something!"
    $got = (powershell -File OpinionatedCommitMessage.ps1 -message $message -dontThrow)|Out-String

    $nl = [Environment]::NewLine
    $expected = (
        "* The first word of the subject (`"Do`") must not match the first word of the body. " +
        "Please make the body more informative by adding more information instead of repeating " +
        "the subject. For example, start by explaining the problem that this change is " +
        'intendended to solve or what was previously missing (e.g., "Previously, ....").' + $nl
    )

    if ($got -ne $expected)
    {
        Write-Host "TestFailIdenticalFirstWordInBodyAndSubject: FAILED"
        WriteExpectedGot -expected $expected -got $got
        return $false
    }

    Write-Host "TestFailIdenticalFirstWordInBodyAndSubject: OK"
    return $true
}

function TestOK
{
    $message = "Do something`n`nThis patch does something."
    $got = (powershell -File OpinionatedCommitMessage.ps1 -message $message -dontThrow)|Out-String

    $nl = [Environment]::NewLine
    $expected = "The message is OK.${nl}"

    if ($got -ne $expected)
    {
        Write-Host "TestOK: FAILED"
        WriteExpectedGot -expected $expected -got $got
        return $false
    }

    Write-Host "TestOK: OK"
    return $true
}

function TestOKCarriageReturn
{
    $trail = "a" * 47
    $bodyLine = "b" * 72
    $message = "Do ${trail}`r`n`n$bodyLine`r`n"
    $got = (powershell -File OpinionatedCommitMessage.ps1 -message $message -dontThrow)|Out-String

    $nl = [Environment]::NewLine
    $expected = "The message is OK.${nl}"

    if ($got -ne $expected)
    {
        Write-Host "TestOKCarriageReturn: FAILED"
        WriteExpectedGot -expected $expected -got $got
        return $false
    }

    Write-Host "TestOKCarriageReturn: OK"
    return $true
}

function TestOKMergeBranch
{
    $message = "Merge branch 'V20DataModel' into miho/Conform-to-spec"
    $got = (powershell -File OpinionatedCommitMessage.ps1 -message $message -dontThrow)|Out-String

    $nl = [Environment]::NewLine
    $expected = "The message is OK.${nl}"

    if ($got -ne $expected)
    {
        Write-Host "TestOKMergeBranch: FAILED"
        WriteExpectedGot -expected $expected -got $got
        return $false
    }

    Write-Host "TestOKMergeBranch: OK"
    return $true
}

function TestOKAdditionalVerbs
{
    $message = "Munzekonza something`n`nThis patch does something."
    $got = (powershell `
        -File OpinionatedCommitMessage.ps1 `
        -message $message `
        -additionalVerbs "munzekonza, zemun" `
        -dontThrow)|Out-String

    $nl = [Environment]::NewLine
    $expected = "The message is OK.${nl}"

    if ($got -ne $expected)
    {
        Write-Host "TestOKAdditionalVerbs: FAILED"
        WriteExpectedGot -expected $expected -got $got
        return $false
    }

    Write-Host "TestOKAdditionalVerbs: OK"
    return $true
}

function TestOKPathToAdditionalVerbs
{
    $tmp = New-TemporaryFile

    try
    {
        "zemun`r`nmunzekonza" | Out-File $tmp.FullName

        $message = "Munzekonza something`n`nThis patch does something."
        $got = (powershell `
            -File OpinionatedCommitMessage.ps1 `
            -message $message `
            -pathToAdditionalVerbs $tmp.FullName `
            -dontThrow)|Out-String

        $nl = [Environment]::NewLine
        $expected = "The message is OK.${nl}"

        if ($got -ne $expected)
        {
            Write-Host "TestOKPathToAdditionalVerbs: FAILED"
            WriteExpectedGot -expected $expected -got $got
            return $false
        }

        Write-Host "TestOKPathToAdditionalVerbs: OK"
        return $true
    }
    finally
    {
        Remove-Item $tmp.FullName -Force
    }
}

function TestOKWithAllowOneLiners
{
    $message = "Do something"
    $got = (powershell `
        -File OpinionatedCommitMessage.ps1 `
        -message $message `
        -allowOneLiners `
        -dontThrow
    )|Out-String

    $nl = [Environment]::NewLine
    $expected = "The message is OK.${nl}"

    if ($got -ne $expected)
    {
        Write-Host "TestOKWithAllowOneLiners: FAILED"
        WriteExpectedGot -expected $expected -got $got
        return $false
    }

    Write-Host "TestOKWithAllowOneLiners: OK"
    return $true
}

function TestFailWithAllowOneLiners
{
    $message = "Do something."
    $got = (powershell `
        -File OpinionatedCommitMessage.ps1 `
        -message $message `
        -allowOneLiners `
        -dontThrow
    )|Out-String

    $nl = [Environment]::NewLine
    $expected = "* The subject must not end with a dot ('.'). Please remove the trailing dot(s).${nl}"

    if ($got -ne $expected)
    {
        Write-Host "TestFailWithAllowOneLiners: FAILED"
        WriteExpectedGot -expected $expected -got $got
        return $false
    }

    Write-Host "TestFailWithAllowOneLiners: OK"
    return $true
}

function TestOKWithURLOnSeparateLine
{
    $url = ("http://mristin@some-domain.com/some/very/very/very/very/" +
        "very/very/very/long/path/index.html")

    $message = "Do something`n`nThis does something with URL:`n$url"
    $got = (powershell -File OpinionatedCommitMessage.ps1 -message $message -dontThrow)|Out-String

    $nl = [Environment]::NewLine
    $expected = "The message is OK.${nl}"

    if ($got -ne $expected)
    {
        Write-Host "TestOKWithURLOnSeparateLine: FAILED"
        WriteExpectedGot -expected $expected -got $got
        return $false
    }

    Write-Host "TestOKWithURLOnSeparateLine: OK"
    return $true
}

function TestOKWithLinkDefinition
{
    $url = ("http://mristin@some-domain.com/some/very/very/very/very/" +
        "very/very/very/long/path/index.html")

    $message = "Do something`n`nThis does something with URL: [1]`n`n[1]: $url"
    $got = (powershell -File OpinionatedCommitMessage.ps1 -message $message -dontThrow)|Out-String

    $nl = [Environment]::NewLine
    $expected = "The message is OK.${nl}"

    if ($got -ne $expected)
    {
        Write-Host "TestOKWithLinkDefinition: FAILED"
        WriteExpectedGot -expected $expected -got $got
        return $false
    }

    Write-Host "TestOKWithLinkDefinition: OK"
    return $true
}

function TestOKSignedOff
{
    $message = (
        "Do something`n`nIt does something.`n" +
        "Signed-off-by: Somebody <some@body.com>`n`n" +
        "Signed-off is not necessarily the last line.`n`n" +
        "And multiple sign-offs are possible!`n" +
        "Signed-off-by: Somebody Else <some@body-else.com>`n"
    )
    $got = (powershell -File OpinionatedCommitMessage.ps1 -message $message -dontThrow)|Out-String

    $nl = [Environment]::NewLine
    $expected = "The message is OK.${nl}"

    if ($got -ne $expected)
    {
        Write-Host "TestOKSignedOff: FAILED"
        WriteExpectedGot -expected $expected -got $got
        return $false
    }

    Write-Host "TestOKSignedOff: OK"
    return $true
}

function TestFailSignedOff
{
    $message = (
        "Do something`n`n" +
        "It does something.`n`n" +
        "None of the following satisfy the sign-off:`n" +
        "Signed-off-by Random Developer <random@developer.example.org>`n" +
        "signed-off-by: Random Developer <random@developer.example.org>`n" +
        "Signed-off-by: Random Developer <randomdeveloper.example.org>`n" +
        "Signed-off-by: Random Developer (random@developer.example.org)`n" +
        "Signed-off-by: Random Developer random@developer.example.org`n" +
        "Signed off by: Random Developer <random@developer.example.org>`n" +
        "Signed_off_by: Random Developer <random@developer.example.org>`n" +
        "Signed-off-by: Random Developer`n"
    )
    
    $got = (powershell `
        -File OpinionatedCommitMessage.ps1 `
        -message $message `
        -enforceSignOff `
        -dontThrow
    )|Out-String

    $nl = [Environment]::NewLine
    $expected = (
        "* The body does not contain any 'Signed-off-by: ' line. " +
        "Did you sign off the commit with ``git commit --signoff``?${nl}"
    )

    if ($got -ne $expected)
    {
        Write-Host "TestFailSignedOff: FAILED"
        WriteExpectedGot -expected $expected -got $got
        return $false
    }

    Write-Host "TestFailSignedOff: OK"
    return $true
}

function Main
{
    Push-Location
    Set-Location $PSScriptRoot

    try
    {
        $success = $true
        $success = TestFailTooFewLines -and $success
        $success = TestFailSubjectWithNonWord -and $success
        $success = TestFailSubjectWithNonCapitalized -and $success
        $success = TestFailSubjectWithNonVerb -and $success
        $success = TestFailSubjectWithTrailingDot -and $success
        $success = TestFailSubjectTooLong -and $success
        $success = TestFailBodyTooLong -and $success
        $success = TestFailIdenticalFirstWordInBodyAndSubject -and $success
        $success = TestOK -and $success
        $success = TestOKMergeBranch -and $success
        $success = TestOKCarriageReturn -and $success
        $success = TestOKAdditionalVerbs -and $success
        $success = TestOKPathToAdditionalVerbs -and $success
        $success = TestOKWithAllowOneLiners -and $success
        $success = TestFailWithAllowOneLiners -and $success
        $success = TestOKWithURLOnSeparateLine -and $success
        $success = TestOKWithLinkDefinition -and $success
        $success = TestOKSignedOff -and $success
        $success = TestFailSignedOff -and $success
        
        if(!$success)
        {
            throw "One or more unit tests failed."
        }
    }
    finally
    {
        Pop-Location
    }
}

Main
